package main

import (
	"io"
	"net/http"
	"sort"
	"time"

	"github.com/MobilityData/gtfs-realtime-bindings/golang/gtfs"
	"github.com/gin-gonic/gin"
	"google.golang.org/protobuf/proto"
)

type Direction string

const (
    DirectionUptown Direction = "uptown"
    DirectionDowntown Direction = "downtown"
)

type ISO8601Time string

type Arrival struct {
    StopID          string    `json:"stop_id"`
	RouteID         string    `json:"route_id"`
    Direction       Direction `json:"direction"`
	ArrivesInMin    int       `json:"arrives_in_min"`
}

const (
	_mtaApiUrl = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs"
	apiVersion = "v1"
)

type DeviceConfig struct {
	RouteID   string
	StopID    string
	Direction Direction
}

var deviceConfigs = map[string][]DeviceConfig{
	"4061E9D8CBB0": {
		{RouteID: "1", StopID: "120S", Direction: DirectionDowntown},
		{RouteID: "2", StopID: "120S", Direction: DirectionDowntown},
		{RouteID: "3", StopID: "120S", Direction: DirectionDowntown},
	},
}

func main() {
	router := gin.Default()

	api := router.Group("/api/" + apiVersion)
	api.GET("/devices/:device_id/arrivals", getArrivalsHandler)

	if err := router.Run(":8080"); err != nil {
		panic(err)
	}
}

func getArrivalsHandler(c *gin.Context) {
	deviceID := c.Param("device_id")
	if deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "device_id is required"})
		return
	}

	cfgs, ok := deviceConfigs[deviceID]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "unknown device_id"})
		return
	}

	resp, err := http.Get(_mtaApiUrl)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch GTFS feed"})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read GTFS response body"})
		return
	}

	var feed gtfs.FeedMessage
	if err := proto.Unmarshal(body, &feed); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode GTFS protobuf"})
		return
	}

	now := time.Now()
	arrivals := make([]Arrival, 0)
	for _, entity := range feed.Entity {
		u := entity.TripUpdate
		if u == nil || u.Trip == nil || u.Trip.RouteId == nil {
			continue
		}
		routeID := *u.Trip.RouteId

		for _, cfg := range cfgs {
			if routeID != cfg.RouteID {
				continue
			}
			for _, stopTimeUpdate := range u.StopTimeUpdate {
				if stopTimeUpdate.StopId == nil || *stopTimeUpdate.StopId != cfg.StopID {
					continue
				}
				if stopTimeUpdate.Arrival == nil || stopTimeUpdate.Arrival.Time == nil {
					continue
				}
				arrival := time.Unix(*stopTimeUpdate.Arrival.Time, 0)
				sec := int(arrival.Sub(now).Seconds())
				if sec < 0 {
					continue
				}
				mins := (sec + 59) / 60 // round up to whole minutes
				arrivals = append(arrivals, Arrival{
					StopID:       *stopTimeUpdate.StopId,
					RouteID:      routeID,
					Direction:    cfg.Direction,
					ArrivesInMin: mins,
				})
			}
		}
	}

    sort.SliceStable(arrivals, func(i, j int) bool {
        return arrivals[i].ArrivesInMin < arrivals[j].ArrivesInMin
    })

	c.JSON(http.StatusOK, arrivals[:4])
}
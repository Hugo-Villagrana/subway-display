package main

import (
	"io"
	"net/http"
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

type Trip struct {
	TripID      string      `json:"trip_id"`
	RouteID     string      `json:"route_id"`
	StopID      string      `json:"stop_id"`
	ArrivalTime ISO8601Time `json:"arrival_time"`
	Direction   Direction   `json:"direction"`
}

const _mtaApiUrl = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs"

func main() {
	router := gin.Default()

	router.GET("/trips", getTripsHandler)

	if err := router.Run(":8080"); err != nil {
		panic(err)
	}
}

func getTripsHandler(c *gin.Context) {
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

    trips := make([]Trip, 0)
    for _, entity := range feed.Entity {
        if entity.TripUpdate == nil {
            continue
        }

        u := entity.TripUpdate
        if u.Trip.RouteId != nil && *u.Trip.RouteId == "1" {
            for _, stopTimeUpdate := range u.StopTimeUpdate {
                if stopTimeUpdate.StopId != nil && *stopTimeUpdate.StopId == "120S" {
                    if stopTimeUpdate.Arrival != nil && stopTimeUpdate.Arrival.Time != nil {
                        t := time.Unix(*stopTimeUpdate.Arrival.Time, 0).UTC()
                        isoString := t.Format(time.RFC3339)
                        trips = append(trips, Trip{
                            TripID:      *u.Trip.TripId,
                            RouteID:     *u.Trip.RouteId,
                            StopID:      *stopTimeUpdate.StopId,
                            ArrivalTime: ISO8601Time(isoString),
                            Direction:   DirectionDowntown,
                        })
                    }
                }
            }
        }
    }

    c.JSON(http.StatusOK, trips)
}
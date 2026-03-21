package main

import (
	"context"
	"errors"
	"io"
	"net/http"
	"os"
	"sort"
	"time"

	pgdb "github.com/Hugo-Villagrana/display/internal/db"
	"github.com/Hugo-Villagrana/display/internal/device"
	"github.com/MobilityData/gtfs-realtime-bindings/golang/gtfs"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

type ISO8601Time string

type handler struct {
	logger *zap.Logger
}

type Arrival struct {
	StopID       string           `json:"stop_id"`
	RouteID      string           `json:"route_id"`
	Direction    device.Direction `json:"direction"`
	ArrivesInMin int              `json:"arrives_in_min"`
}

const (
	_mtaApiUrl  = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs"
	_apiVersion = "v1"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()
	sugar := logger.Sugar()

	dbURI := os.Getenv("DATABASE_URI")
	if dbURI == "" {
		sugar.Fatal("DATABASE_URI is not set")
	}

	conn, err := pgx.Connect(context.Background(), dbURI)
	if err != nil {
		sugar.Fatalw("failed to connect to database", "error", err)
	}
	defer conn.Close(context.Background())
	db := pgdb.NewDB(conn)

	router := gin.Default()

	h := &handler{logger: logger}
	api := router.Group("/api/" + _apiVersion)
	api.GET("/devices/:device_id/arrivals", func(c *gin.Context) { h.getArrivalsHandler(c, db) })
	api.GET("/devices/:device_id/configs", func(c *gin.Context) { h.getDeviceConfigsHandler(c, db) })
	api.POST("/devices/:device_id/configs", func(c *gin.Context) { h.createDeviceConfigHandler(c, db) })
	api.DELETE("/devices/configs/:id", func(c *gin.Context) { h.deleteDeviceConfigHandler(c, db) })

	if err := router.Run(":8080"); err != nil {
		panic(err)
	}
}

func (h *handler) getArrivalsHandler(c *gin.Context, db *pgdb.DB) {
	sugar := h.logger.Sugar()
	deviceID := c.Param("device_id")
	if deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "device_id is required"})
		return
	}

	cfgs, err := db.GetDeviceConfigs(context.Background(), []string{deviceID})
	if err != nil {
		sugar.Errorw("failed to get device configs", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get device configs"})
		return
	}
	if len(cfgs) == 0 {
		sugar.Debugw("device not found", "device_id", deviceID)
		c.JSON(http.StatusNotFound, gin.H{"error": "device not found"})
		return
	}

	resp, err := http.Get(_mtaApiUrl)
	defer resp.Body.Close()
	if err != nil {
		sugar.Errorw("failed to fetch GTFS feed", "error", err)
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to fetch GTFS feed"})
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		sugar.Errorw("failed to read GTFS response body", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read GTFS response body"})
		return
	}

	var feed gtfs.FeedMessage
	if err := proto.Unmarshal(body, &feed); err != nil {
		sugar.Errorw("failed to decode GTFS protobuf", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode GTFS protobuf"})
		return
	}

	now := time.Now()
	arrivals := make([]Arrival, 0)
	for _, entity := range feed.Entity {
		u := entity.TripUpdate
		if u == nil || u.Trip == nil || u.Trip.RouteId == nil {
			sugar.Debugw("skipping entity", "entity", entity)
			continue
		}
		routeID := *u.Trip.RouteId

		for _, cfg := range cfgs {
			if routeID != cfg.RouteID {
				sugar.Debugw("skipping route", "route_id", routeID, "cfg_route_id", cfg.RouteID)
				continue
			}
			for _, stopTimeUpdate := range u.StopTimeUpdate {
				if stopTimeUpdate.StopId == nil || *stopTimeUpdate.StopId != cfg.StopID {
					sugar.Debugw("skipping stop", "stop_id", *stopTimeUpdate.StopId, "cfg_stop_id", cfg.StopID)
					continue
				}
				if stopTimeUpdate.Arrival == nil || stopTimeUpdate.Arrival.Time == nil {
					sugar.Debugw("skipping arrival", "arrival", stopTimeUpdate.Arrival)
					continue
				}
				arrival := time.Unix(*stopTimeUpdate.Arrival.Time, 0)
				sec := int(arrival.Sub(now).Seconds())
				if sec < 0 {
					sugar.Debugw("skipping arrival in the past", "arrival", arrival)
					continue
				}
				mins := sec / 60 // round down to whole minutes
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

	const (
		maxResults      = 4
		minArrivesInMin = 4
	)

	filtered := make([]Arrival, 0, maxResults)
	for _, arrival := range arrivals {
		if len(filtered) >= maxResults {
			break
		}
		if arrival.ArrivesInMin <= minArrivesInMin {
			sugar.Debugw("skipping arrival too close", "arrival", arrival)
			continue
		}
		filtered = append(filtered, arrival)
	}

	sugar.Debugw("arrivals filtered", "filtered", filtered)
	c.JSON(http.StatusOK, filtered)
}

func (h *handler) createDeviceConfigHandler(c *gin.Context, db *pgdb.DB) {
	sugar := h.logger.Sugar()
	deviceID := c.Param("device_id")
	if deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "device_id is required"})
		return
	}

	var cfg device.DeviceConfig
	if err := c.ShouldBindJSON(&cfg); err != nil {
		sugar.Errorw("failed to bind request body", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	cfg.DeviceID = deviceID

	err := db.CreateDeviceConfig(context.Background(), cfg)
	if err != nil {
		if errors.Is(err, pgdb.ErrDeviceConfigAlreadyExists) {
			sugar.Errorw("device config already exists", "device_id", deviceID, "config", cfg)
			c.JSON(http.StatusConflict, gin.H{"error": "device config already exists"})
			return
		}
		sugar.Errorw("failed to create device config", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create device config"})
		return
	}

	sugar.Infow("device config created", "device_id", deviceID, "config", cfg)
	c.JSON(http.StatusOK, gin.H{"message": "device config created"})
}

func (h *handler) getDeviceConfigsHandler(c *gin.Context, db *pgdb.DB) {
	sugar := h.logger.Sugar()
	deviceID := c.Param("device_id")
	if deviceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "device_id is required"})
		return
	}

	cfgs, err := db.GetDeviceConfigs(context.Background(), []string{deviceID})
	if err != nil {
		sugar.Errorw("failed to get device configs", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get device configs"})
		return
	}

	sugar.Debugw("device configs fetched", "device_id", deviceID, "configs", cfgs)
	c.JSON(http.StatusOK, cfgs)
}

func (h *handler) deleteDeviceConfigHandler(c *gin.Context, db *pgdb.DB) {
	sugar := h.logger.Sugar()
	configID := c.Param("id")
	if configID == "" {
		sugar.Errorw("config_id is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "config_id is required"})
		return
	}

	err := db.DeleteDeviceConfig(context.Background(), configID)
	if err != nil {
		sugar.Errorw("failed to delete device config", "error", err, "config_id", configID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete device config"})
		return
	}

	sugar.Debugw("device config deleted", "config_id", configID)
	c.JSON(http.StatusOK, gin.H{"message": "device config deleted"})
}

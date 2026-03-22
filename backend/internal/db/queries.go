package db

import (
	"context"
	"errors"

	"github.com/Hugo-Villagrana/display/internal/device"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrDeviceConfigAlreadyExists = errors.New("device config already exists")
)

type DB struct {
	pool *pgxpool.Pool
}

func NewDB(pool *pgxpool.Pool) *DB {
	return &DB{
		pool: pool,
	}
}

func (db *DB) CreateDeviceConfig(ctx context.Context, cfg device.DeviceConfig) error {
	query := `
		INSERT INTO device_configs (device_id, route_id, stop_id, direction) VALUES ($1, $2, $3, $4)
	`
	_, err := db.pool.Exec(ctx, query, cfg.DeviceID, cfg.RouteID, cfg.StopID, cfg.Direction)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrDeviceConfigAlreadyExists
		}
		return err
	}
	return nil
}

func (db *DB) GetDeviceConfigs(ctx context.Context, deviceIDs []string) ([]device.DeviceConfig, error) {
	query := `
		SELECT id, device_id, route_id, stop_id, direction FROM device_configs WHERE device_id = ANY($1)
	`
	rows, err := db.pool.Query(ctx, query, deviceIDs)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	configs := make([]device.DeviceConfig, 0)
	for rows.Next() {
		var config device.DeviceConfig
		err := rows.Scan(&config.ID, &config.DeviceID, &config.RouteID, &config.StopID, &config.Direction)
		if err != nil {
			return nil, err
		}
		configs = append(configs, config)
	}

	return configs, nil
}

func (db *DB) DeleteDeviceConfig(ctx context.Context, configID string) error {
	query := `
		DELETE FROM device_configs WHERE id = $1
	`
	_, err := db.pool.Exec(ctx, query, configID)
	return err
}

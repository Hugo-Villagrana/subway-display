package device

type Direction string

const (
	DirectionUptown   Direction = "uptown"
	DirectionDowntown Direction = "downtown"
)

type DeviceConfig struct {
	ID        string    `json:"id"`
	DeviceID  string    `json:"device_id"`
	RouteID   string    `json:"route_id"`
	StopID    string    `json:"stop_id"`
	Direction Direction `json:"direction"`
}

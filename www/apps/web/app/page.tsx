"use server"

import { RouteViewer, type DeviceConfig } from "@/components/route-viewer"
import { BACKEND_URL } from "@/lib/shared"

type GetConfigResponseSchema = {
  id: string
  device_id: string
  route_id: string
  stop_id: string
  direction: string
}

async function getConfigs(deviceId: string): Promise<DeviceConfig[]> {
  const response = await fetch(
    `${BACKEND_URL}/api/v1/devices/${deviceId}/configs`,
    {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  )
  if (!response.ok) {
    throw new Error("Failed to get configs")
  }

  const raw: GetConfigResponseSchema[] = await response.json()
  return raw.map((r) => ({
    id: r.id,
    deviceId: r.device_id,
    routeId: r.route_id,
    stopId: r.stop_id,
    direction: r.direction,
  }))
}

/** Stub — wire to your API (e.g. DELETE /api/v1/devices/configs/:id). */
export async function deleteDeviceConfig(_configId: string): Promise<void> {
  void _configId
}

export default async function Page() {
  const configs = await getConfigs("4061E9D8CBB0")

  return (
    <div className="flex min-h-svh p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
      <div className="mx-auto w-full max-w-lg min-w-0">
        <RouteViewer configs={configs} />
      </div>
    </div>
  )
}

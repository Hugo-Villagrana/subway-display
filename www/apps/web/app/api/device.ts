"use server"

const BACKEND_URL = process.env.WWW_BACKEND_URL ?? "http://0.0.0.0:8080"

export async function createDeviceConfig(formData: FormData) {
  const station = formData.get("station")
  const route = formData.get("route")
  const deviceId = formData.get("deviceId")

  const response = await fetch(
    `${BACKEND_URL}/api/v1/devices/${deviceId}/configs`,
    {
      method: "POST",
      body: JSON.stringify({
        stop_id: station,
        route_id: route,
        direction: "downtown",
      }),
    }
  )

  if (!response.ok) {
    throw new Error("Failed to create device config")
  }

  return response.json()
}

export async function deleteDeviceConfig(configId: string) {
  const response = await fetch(
    `http://0.0.0.0:8080/api/v1/devices/configs/${configId}`,
    {
      method: "DELETE",
    }
  )

  if (!response.ok) {
    throw new Error("Failed to delete device config")
  }

  return response.json()
}

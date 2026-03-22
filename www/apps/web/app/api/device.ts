"use server"

import { BACKEND_URL } from "@/lib/shared"
import { revalidatePath } from "next/cache"

export async function createDeviceConfig(formData: FormData) {
  const station = formData.get("station")
  const route = formData.get("route")
  const deviceId = "4061E9D8CBB0"
  console.log("server action called", {
    station,
    route,
    deviceId,
  })
  const response = await fetch(
    `${BACKEND_URL}/api/v1/devices/${deviceId}/configs`,
    {
      method: "POST",
      body: JSON.stringify({
        stop_id: station,
        route_id: route,
        direction: "downtown",
      }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error("Failed to create device config")
  }

  revalidatePath("/")
  return response.json()
}

export async function deleteDeviceConfig(configId: string) {
  const response = await fetch(
    `${BACKEND_URL}/api/v1/devices/configs/${configId}`,
    {
      method: "DELETE",
    }
  )

  if (!response.ok) {
    throw new Error("Failed to delete device config")
  }

  revalidatePath("/")
  return response.json()
}

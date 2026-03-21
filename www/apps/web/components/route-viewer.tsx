"use client"

import { Trash2 } from "lucide-react"
import Image from "next/image"

export type DeviceConfig = {
  id: string
  deviceId: string
  routeId: string
  stopId: string
  direction: string
}

type RouteViewerProps = {
  configs: DeviceConfig[]
}

const stopMap: Record<string, string> = {
  "120S": "96th Street",
}

function subwayIconSrc(routeId: string): string | null {
  const id = routeId.trim().toLowerCase()
  if (!/^[a-z0-9]+$/.test(id)) return null
  return `/icons/nyc-subway/${id}.svg`
}

export function RouteViewer({ configs }: RouteViewerProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <h1 className="text-lg font-medium">Route viewer</h1>

      <div className="-mx-1 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[20rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2.5 text-center font-medium">Route</th>
              <th className="px-3 py-2.5 font-medium">Stop</th>
              <th className="px-3 py-2.5 font-medium">Direction</th>
              <th className="w-12 px-2 py-2.5 font-medium">
                <span className="sr-only">Delete</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {configs.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No configurations yet.
                </td>
              </tr>
            ) : (
              configs.map((c) => {
                const iconSrc = subwayIconSrc(c.routeId)
                return (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-3 py-2.5 text-center align-middle">
                      <div className="flex items-center justify-center gap-2">
                        {iconSrc ? (
                          <Image
                            src={iconSrc}
                            alt=""
                            width={20}
                            height={20}
                            className="size-5 shrink-0 object-contain"
                            unoptimized
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {stopMap[c.stopId] || c.stopId}
                    </td>
                    <td className="px-3 py-2.5 capitalize">{c.direction}</td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        className="inline-flex size-11 items-center justify-center rounded-md text-red-900/75 dark:text-red-400/70"
                        aria-label={`Delete configuration ${c.id}`}
                      >
                        <Trash2 className="size-4 shrink-0" aria-hidden />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

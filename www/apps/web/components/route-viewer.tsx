"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { PlusIcon, Trash2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { createDeviceConfig, deleteDeviceConfig } from "@/app/api/device"

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
  "120N": "96th Street",
  "625N": "96th Street",
  "625S": "96th Street",
}

const routes = [
  { value: "1", label: "1 Train" },
  { value: "2", label: "2 Train" },
  { value: "3", label: "3 Train" },
  { value: "A", label: "A Train" },
  { value: "C", label: "C Train" },
  { value: "E", label: "E Train" },
]

const stations = [
  { value: "120S", label: "96th Street (1/2/3) - Downtown" },
  { value: "120N", label: "96th Street (1/2/3) - Uptown" },
  { value: "625N", label: "96th Street (B/C) - Uptown" },
  { value: "625S", label: "96th Street (B/C) - Downtown" },
]

const stopToRouteMap: Record<string, { value: string; label: string }[]> = {
  "120S": [
    { value: "1", label: "1 Train" },
    { value: "2", label: "2 Train" },
    { value: "3", label: "3 Train" },
  ],
  "120N": [
    { value: "1", label: "1 Train" },
    { value: "2", label: "2 Train" },
    { value: "3", label: "3 Train" },
  ],
  "625N": [
    { value: "B", label: "B Train" },
    { value: "C", label: "C Train" },
  ],
  "625S": [
    { value: "B", label: "B Train" },
    { value: "C", label: "C Train" },
  ],
}

function subwayIconSrc(routeId: string): string | null {
  const id = routeId.trim().toLowerCase()
  if (!/^[a-z0-9]+$/.test(id)) return null
  return `/icons/nyc-subway/${id}.svg`
}

export function RouteViewer({ configs }: RouteViewerProps) {
  const [open, setOpen] = useState(false)
  const [selectedStation, setSelectedStation] = useState<string | null>()
  const [selectedRoute, setSelectedRoute] = useState<string | null>()

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex w-full items-center justify-between gap-2">
        <h1 className="text-lg font-medium">Current Routes</h1>
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) {
              setSelectedStation(null)
            }
          }}
        >
          <DialogTrigger
            render={
              <Button variant="outline">
                <PlusIcon className="size-4 shrink-0" aria-hidden />
                <span>Add Route</span>
              </Button>
            }
          />
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Route</DialogTitle>
              <DialogDescription>
                Select a route to add to your device.
              </DialogDescription>
            </DialogHeader>

            <form
              action={async (formData) => {
                const resp = await createDeviceConfig(formData)
                console.log("createDeviceConfig response", resp)
                setOpen(false)
                setSelectedStation(null)
                setSelectedRoute(null)
              }}
              method="POST"
            >
              <FieldGroup>
                <Field id="station">
                  <Label htmlFor="station">Station</Label>
                  <Select items={stations} onValueChange={setSelectedStation}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a station" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {stations.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <span className="ml-2 truncate">{s.label}</span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field id="route">
                  <Label htmlFor="route">Route</Label>
                  <Select
                    disabled={!selectedStation}
                    items={stopToRouteMap[selectedStation ?? ""] ?? []}
                    onValueChange={setSelectedRoute}
                  >
                    <SelectTrigger className="w-full">
                      {selectedRoute ? (
                        <SelectValue>
                          {subwayIconSrc(selectedRoute) && (
                            <Image
                              src={subwayIconSrc(selectedRoute ?? "") ?? ""}
                              alt={selectedRoute ?? ""}
                              width={20}
                              height={20}
                              className="size-5 shrink-0 object-contain"
                              unoptimized
                            />
                          )}
                          <span className="ml-2 truncate">
                            {
                              routes.find((r) => r.value === selectedRoute)
                                ?.label
                            }
                          </span>
                        </SelectValue>
                      ) : (
                        <SelectValue placeholder="Select a route" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {stopToRouteMap[selectedStation ?? ""]?.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {subwayIconSrc(r.value) && (
                              <Image
                                src={subwayIconSrc(r.value) ?? ""}
                                alt={r.label}
                                width={20}
                                height={20}
                                className="size-5 shrink-0 object-contain"
                                unoptimized
                              />
                            )}
                            <span className="ml-2 truncate">{r.label}</span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <Input
                type="hidden"
                name="station"
                value={selectedStation ?? ""}
              />
              <Input type="hidden" name="route" value={selectedRoute ?? ""} />
              <Input type="hidden" name="deviceId" value="4061E9D8CBB0" />
              <DialogFooter className="mt-2">
                <DialogClose
                  render={
                    <Button
                      variant="outline"
                      onClick={() => setSelectedStation(null)}
                    >
                      Cancel
                    </Button>
                  }
                />
                <Button
                  type="submit"
                  disabled={!selectedStation || !selectedRoute}
                >
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
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
                        ) : (
                          <span className="text-xs">{c.routeId}</span>
                        )}
                      </div>
                    </td>
                    <td className="truncate px-3 py-2.5 font-mono text-xs">
                      {stopMap[c.stopId] || c.stopId}
                    </td>
                    <td className="px-3 py-2.5 capitalize">{c.direction}</td>
                    <td className="px-2 py-2">
                      <Dialog>
                        <DialogTrigger
                          render={
                            <Button
                              type="button"
                              variant="outline"
                              className="inline-flex items-center justify-center rounded-md text-red-900/75 dark:text-red-400/70"
                            >
                              <Trash2 className="size-4 shrink-0" aria-hidden />
                            </Button>
                          }
                        />
                        <DialogContent className="sm:max-w-xs">
                          <DialogHeader>
                            <DialogTitle>Delete Route</DialogTitle>
                          </DialogHeader>
                          <DialogDescription>
                            Are you sure you want to delete this route?
                          </DialogDescription>
                          <DialogFooter className="gap-2">
                            <DialogClose
                              render={<Button variant="outline">Cancel</Button>}
                            />
                            <DialogClose
                              render={
                                <Button
                                  variant="destructive"
                                  onClick={async () => {
                                    await deleteDeviceConfig(c.id)
                                  }}
                                >
                                  Delete
                                </Button>
                              }
                            />
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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

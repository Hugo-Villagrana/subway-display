"use client"

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
      <div className="flex w-full items-center justify-between gap-2">
        <h1 className="text-lg font-medium">Current Routes</h1>
        <Dialog>
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
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Add a new route to your device.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="name-1">Name</Label>
                <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
              </Field>
              <Field>
                <Label htmlFor="username-1">Username</Label>
                <Input
                  id="username-1"
                  name="username"
                  defaultValue="@peduarte"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <Button type="submit">Save changes</Button>
            </DialogFooter>
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
                                <Button variant="destructive">Delete</Button>
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

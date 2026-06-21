"use client"

import type { ReactNode } from "react"

import { PublisherProvider } from "@/store/publisher-store"
import { AppSidebar } from "@/components/shell/app-sidebar"
import { AppTopbar, useStoreNotifications } from "@/components/shell/app-topbar"

export function AppShell({ children }: { children: ReactNode }) {
  const notify = useStoreNotifications()

  return (
    <PublisherProvider notify={notify}>
      <div className="flex h-dvh overflow-hidden">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppTopbar />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1500px] px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </PublisherProvider>
  )
}

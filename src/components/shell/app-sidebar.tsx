"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarDays,
  Inbox,
  LayoutGrid,
  PlusCircle,
  Send,
  Settings2,
  type LucideIcon,
} from "lucide-react"

import { usePublisher } from "@/store/publisher-store"
import { isPublishing } from "@/domain/post"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const NAV: NavItem[] = [
  { href: "/", label: "Inbox", icon: Inbox },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/canais", label: "Canais", icon: LayoutGrid },
  { href: "/config", label: "Configurações", icon: Settings2 },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { posts } = usePublisher()

  const reviewCount = posts.filter(
    (p) => p.state === "aRevisar" && !p.rejected && !isPublishing(p)
  ).length

  return (
    <aside className="bg-sidebar text-sidebar-foreground flex w-64 shrink-0 flex-col gap-1 p-3">
      <div className="flex items-center gap-2.5 px-2 py-3">
        <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 items-center justify-center rounded-xl shadow-sm">
          <Send className="size-4.5" />
        </span>
        <div className="leading-tight">
          <p className="font-heading text-sm font-semibold text-white">
            Social Publisher
          </p>
          <p className="text-sidebar-foreground/60 text-xs">
            Cabine de publicação
          </p>
        </div>
      </div>

      <Link
        href="/novo"
        className={cn(
          "bg-sidebar-primary text-sidebar-primary-foreground mt-1 mb-2 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:brightness-110",
          pathname === "/novo" && "ring-2 ring-white/30"
        )}
      >
        <PlusCircle className="size-4" />
        Novo post
      </Link>

      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white"
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.href === "/" && reviewCount > 0 && (
                <span className="bg-sidebar-primary text-sidebar-primary-foreground flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold">
                  {reviewCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="bg-sidebar-accent/40 text-sidebar-foreground/70 mt-auto rounded-lg p-3 text-xs">
        <p className="text-sidebar-foreground/90 font-medium">
          Modo B · receptor
        </p>
        <p className="mt-1 leading-relaxed">
          Dados falsos (F-001). Nenhuma publicação real — o MC e as redes são
          simulados.
        </p>
      </div>
    </aside>
  )
}

import {
  CalendarClock,
  CircleAlert,
  CircleCheck,
  Clock,
  Loader2,
  Ban,
  type LucideIcon,
} from "lucide-react"

import type { ChannelPublishStatus, Post, PostState } from "@/domain/post"
import { isPublishing } from "@/domain/post"
import { cn } from "@/lib/utils"

interface StateMeta {
  label: string
  icon: LucideIcon
  className: string
}

const STATE_META: Record<PostState, StateMeta> = {
  aRevisar: {
    label: "A revisar",
    icon: Clock,
    className: "bg-status-review text-status-review-foreground",
  },
  agendado: {
    label: "Agendado",
    icon: CalendarClock,
    className: "bg-status-scheduled text-status-scheduled-foreground",
  },
  publicado: {
    label: "Publicado",
    icon: CircleCheck,
    className: "bg-status-published text-status-published-foreground",
  },
  falhou: {
    label: "Falhou",
    icon: CircleAlert,
    className: "bg-status-failed text-status-failed-foreground",
  },
}

const PUBLISHING_META: StateMeta = {
  label: "Publicando…",
  icon: Loader2,
  className: "bg-status-scheduled text-status-scheduled-foreground",
}

const REJECTED_META: StateMeta = {
  label: "Recusado",
  icon: Ban,
  className: "bg-status-rejected text-status-rejected-foreground",
}

/** Badge do estado do post na máquina (com prioridade para publicando/recusado). */
export function PostStatusBadge({
  post,
  className,
}: {
  post: Post
  className?: string
}) {
  const meta = post.rejected
    ? REJECTED_META
    : isPublishing(post)
      ? PUBLISHING_META
      : STATE_META[post.state]
  const Icon = meta.icon
  const spinning = meta === PUBLISHING_META
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1.5 rounded-full px-2.5 text-xs font-medium",
        meta.className,
        className
      )}
    >
      <Icon className={cn("size-3.5", spinning && "animate-spin")} />
      {meta.label}
    </span>
  )
}

const CHANNEL_STATUS_META: Record<
  ChannelPublishStatus,
  { label: string; icon: LucideIcon; className: string; spin?: boolean }
> = {
  pendente: {
    label: "Pendente",
    icon: Clock,
    className: "text-muted-foreground",
  },
  publicando: {
    label: "Publicando",
    icon: Loader2,
    className: "text-status-scheduled-foreground",
    spin: true,
  },
  publicado: {
    label: "Publicado",
    icon: CircleCheck,
    className: "text-status-published-foreground",
  },
  falhou: {
    label: "Falhou",
    icon: CircleAlert,
    className: "text-status-failed-foreground",
  },
}

export function ChannelStatusIcon({
  status,
  className,
}: {
  status: ChannelPublishStatus
  className?: string
}) {
  const meta = CHANNEL_STATUS_META[status]
  const Icon = meta.icon
  return (
    <Icon
      className={cn(
        "size-4",
        meta.className,
        meta.spin && "animate-spin",
        className
      )}
    />
  )
}

export function channelStatusLabel(status: ChannelPublishStatus): string {
  return CHANNEL_STATUS_META[status].label
}

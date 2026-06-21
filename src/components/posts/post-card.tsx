"use client"

import Link from "next/link"
import {
  CalendarClock,
  Check,
  Clock3,
  ImageIcon,
  PencilLine,
  RotateCcw,
  Send,
  Share2,
  Undo2,
  X,
  Zap,
} from "lucide-react"

import type { PostContent } from "@/domain/content"
import type { Post } from "@/domain/post"
import { isPublishing } from "@/domain/post"
import { usePublisher } from "@/store/publisher-store"
import { Button } from "@/components/ui/button"
import { PostStatusBadge } from "@/components/posts/status-badge"
import { ChannelResults } from "@/components/posts/channel-results"
import { ChannelChip } from "@/components/networks/network-mark"
import { resolveChannels } from "@/lib/channels"
import {
  formatDateTime,
  formatTime,
  fromDateTimeLocal,
  relativeDayLabel,
  toDateTimeLocal,
} from "@/lib/format"
import { cn } from "@/lib/utils"

export function PostCard({ post }: { post: Post }) {
  const {
    channels,
    approve,
    reject,
    restore,
    retry,
    publishScheduledNow,
    updateContent,
    nowISO,
  } = usePublisher()
  const postChannels = resolveChannels(post.content.channels, channels)
  const publishing = isPublishing(post)
  const id = post.content.deliveryId
  const isReview = post.state === "aRevisar" && !post.rejected && !publishing

  const mediaCount = post.content.media.length

  function setSchedule(schedule: PostContent["schedule"]) {
    updateContent(id, { ...post.content, schedule })
  }

  return (
    <article className="group bg-card ring-foreground/5 hover:ring-primary/25 flex h-full flex-col gap-3.5 rounded-2xl border p-5 shadow-sm ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <OriginPill origin={post.content.origin} />
          <PostStatusBadge post={post} />
          {post.content.autoPublish ? (
            <span className="bg-accent text-accent-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
              <Zap className="size-3" />
              Automático
            </span>
          ) : null}
        </div>
        <span className="text-muted-foreground inline-flex items-center gap-1 text-xs whitespace-nowrap">
          <Clock3 className="size-3" />
          {relativeDayLabel(post.receivedAt, nowISO)}
        </span>
      </div>

      {/* Texto — até 3 linhas */}
      <p className="text-card-foreground/90 line-clamp-3 min-h-15 text-[15px] leading-relaxed whitespace-pre-wrap">
        {post.content.base.text || "(sem texto)"}
      </p>

      {/* Meta: canais + mídias */}
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1">
          <Share2 className="size-3.5" />
          {postChannels.length} {postChannels.length === 1 ? "canal" : "canais"}
        </span>
        <span className="inline-flex items-center gap-1">
          <ImageIcon className="size-3.5" />
          {mediaCount} {mediaCount === 1 ? "mídia" : "mídias"}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {postChannels.map((channel) => (
          <ChannelChip key={channel.slug} channel={channel} />
        ))}
      </div>

      {/* Agendamento: editável na revisão; só leitura nos demais estados */}
      {isReview ? (
        <ScheduleControl
          schedule={post.content.schedule}
          nowISO={nowISO}
          onChange={setSchedule}
        />
      ) : (
        <ScheduleInfo post={post} nowISO={nowISO} />
      )}

      {post.channelResults.some(
        (r) => r.status === "publicado" || r.status === "falhou"
      ) && <ChannelResults post={post} channels={channels} />}

      {/* Ações fixadas no rodapé (alinhadas entre os cards) */}
      <div className="border-border/60 mt-auto flex flex-wrap items-center gap-2 border-t pt-3.5">
        <Actions
          post={post}
          publishing={publishing}
          onApprove={() => approve(id)}
          onReject={() => reject(id)}
          onRestore={() => restore(id)}
          onRetry={() => retry(id)}
          onPublishNow={() => publishScheduledNow(id)}
        />
      </div>
    </article>
  )
}

function OriginPill({ origin }: { origin: "mc" | "manual" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        origin === "mc"
          ? "bg-primary/10 text-primary"
          : "bg-secondary text-secondary-foreground"
      )}
    >
      {origin === "mc" ? "Mission Control" : "Manual"}
    </span>
  )
}

/** Resumo (somente leitura) do agendamento, para estados fora de revisão. */
function ScheduleInfo({ post, nowISO }: { post: Post; nowISO: string }) {
  const schedule = post.content.schedule
  const label =
    schedule.mode === "now"
      ? "Imediato"
      : `${relativeLabel(schedule.at, nowISO)} · ${formatTime(schedule.at)}`
  const Icon = schedule.mode === "now" ? Send : CalendarClock
  const prefix =
    post.state === "publicado"
      ? "Publicado"
      : post.state === "agendado"
        ? "Agendado para"
        : post.state === "falhou"
          ? "Tentado"
          : "Publicação"
  return (
    <div className="bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
      <Icon className="size-3.5" />
      <span>
        <span className="font-medium">{prefix}:</span> {label}
      </span>
    </div>
  )
}

/** Controle de agendamento na revisão: publicar agora ou agendar (com horário). */
function ScheduleControl({
  schedule,
  nowISO,
  onChange,
}: {
  schedule: PostContent["schedule"]
  nowISO: string
  onChange: (s: PostContent["schedule"]) => void
}) {
  const isAt = schedule.mode === "at"
  return (
    <div className="bg-muted/40 flex flex-col gap-2.5 rounded-lg p-3">
      <span className="text-muted-foreground text-xs font-medium">
        Quando publicar
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <SegButton active={!isAt} onClick={() => onChange({ mode: "now" })}>
          <Send className="size-3.5" />
          Imediato
        </SegButton>
        <SegButton
          active={isAt}
          onClick={() =>
            onChange({
              mode: "at",
              at: isAt
                ? schedule.at
                : new Date(Date.parse(nowISO) + 3_600_000).toISOString(),
            })
          }
        >
          <CalendarClock className="size-3.5" />
          Agendar
        </SegButton>
        {isAt && (
          <input
            type="datetime-local"
            value={toDateTimeLocal(schedule.at)}
            onChange={(e) =>
              onChange({ mode: "at", at: fromDateTimeLocal(e.target.value) })
            }
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 rounded-lg border bg-transparent px-2.5 py-1.5 text-xs outline-none focus-visible:ring-3"
          />
        )}
      </div>
    </div>
  )
}

function SegButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "bg-card hover:bg-muted"
      )}
    >
      {children}
    </button>
  )
}

function relativeLabel(iso: string, nowISO: string): string {
  const rel = relativeDayLabel(iso, nowISO)
  const isRel = rel === "Hoje" || rel === "Amanhã" || rel === "Ontem"
  return isRel ? rel : formatDateTime(iso).split(" · ")[0]
}

function Actions({
  post,
  publishing,
  onApprove,
  onReject,
  onRestore,
  onRetry,
  onPublishNow,
}: {
  post: Post
  publishing: boolean
  onApprove: () => void
  onReject: () => void
  onRestore: () => void
  onRetry: () => void
  onPublishNow: () => void
}) {
  const id = post.content.deliveryId
  const editHref = `/post/${id}`
  const willSchedule = post.content.schedule.mode === "at"

  if (post.rejected) {
    return (
      <Button variant="outline" size="sm" onClick={onRestore}>
        <Undo2 />
        Restaurar
      </Button>
    )
  }

  if (publishing) {
    return (
      <span className="text-muted-foreground text-xs">
        Publicando nos canais…
      </span>
    )
  }

  if (post.state === "aRevisar") {
    return (
      <>
        <Button size="sm" onClick={onApprove}>
          <Check />
          {willSchedule ? "Aprovar e agendar" : "Aprovar e publicar"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onReject}>
          <X />
          Recusar
        </Button>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={editHref} />}
        >
          <PencilLine />
          Editar
        </Button>
      </>
    )
  }

  if (post.state === "agendado") {
    return (
      <>
        <Button variant="outline" size="sm" onClick={onPublishNow}>
          <Send />
          Publicar agora
        </Button>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={editHref} />}
        >
          <PencilLine />
          Editar
        </Button>
      </>
    )
  }

  if (post.state === "falhou") {
    return (
      <>
        <Button size="sm" onClick={onRetry}>
          <RotateCcw />
          Tentar novamente
        </Button>
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={editHref} />}
        >
          <PencilLine />
          Editar
        </Button>
      </>
    )
  }

  // publicado
  return (
    <Button
      variant="ghost"
      size="sm"
      nativeButton={false}
      render={<Link href={editHref} />}
    >
      <PencilLine />
      Ver / editar
    </Button>
  )
}

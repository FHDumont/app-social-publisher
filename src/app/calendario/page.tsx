"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { postTimestamp, type Post, type PostState } from "@/domain/post"
import { usePublisher } from "@/store/publisher-store"
import { PageHeader } from "@/components/shell/page-header"
import { NetworkMark } from "@/components/networks/network-mark"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { resolveChannels } from "@/lib/channels"
import {
  buildDay,
  buildMonthGrid,
  buildWeek,
  shiftAnchor,
  WEEKDAY_LABELS,
  type CalendarDay,
} from "@/lib/calendar"
import {
  dayKey,
  formatMonthYear,
  formatTime,
  formatWeekday,
  formatWeekdayLong,
} from "@/lib/format"
import { cn } from "@/lib/utils"

type View = "mes" | "semana" | "dia"

const STATE_ACCENT: Record<PostState, string> = {
  aRevisar: "border-l-status-review-foreground",
  agendado: "border-l-status-scheduled-foreground",
  publicado: "border-l-status-published-foreground",
  falhou: "border-l-status-failed-foreground",
}

const STATE_DOT: Record<PostState, string> = {
  aRevisar: "bg-status-review-foreground",
  agendado: "bg-status-scheduled-foreground",
  publicado: "bg-status-published-foreground",
  falhou: "bg-status-failed-foreground",
}

const STATE_LABEL: Record<PostState, string> = {
  aRevisar: "A revisar",
  agendado: "Agendado",
  publicado: "Publicado",
  falhou: "Falhou",
}

const STATE_PILL: Record<PostState, string> = {
  aRevisar: "bg-status-review text-status-review-foreground",
  agendado: "bg-status-scheduled text-status-scheduled-foreground",
  publicado: "bg-status-published text-status-published-foreground",
  falhou: "bg-status-failed text-status-failed-foreground",
}

export default function CalendarPage() {
  const { posts, nowISO, channels } = usePublisher()
  const [view, setView] = useState<View>("semana")
  const [anchor, setAnchor] = useState(nowISO)

  const postsByDay = useMemo(() => {
    const map = new Map<string, Post[]>()
    for (const post of posts) {
      if (post.rejected) continue
      const key = dayKey(postTimestamp(post))
      const list = map.get(key) ?? []
      list.push(post)
      map.set(key, list)
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(postTimestamp(a)).getTime() -
          new Date(postTimestamp(b)).getTime()
      )
    }
    return map
  }, [posts])

  const unit = view === "mes" ? "month" : view === "semana" ? "week" : "day"
  const periodLabel = useMemo(() => {
    if (view === "mes") return formatMonthYear(anchor)
    if (view === "dia")
      return `${formatWeekdayLong(anchor)}, ${formatMonthYear(anchor)}`
    const week = buildWeek(anchor, nowISO)
    return `${week[0].dayNum}–${week[6].dayNum} · ${formatMonthYear(anchor)}`
  }, [view, anchor, nowISO])

  return (
    <>
      <PageHeader
        title="Calendário"
        description="Posts agendados e publicados, por dia e horário. Clique em um post para abrir."
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList>
            <TabsTrigger value="mes">Mês</TabsTrigger>
            <TabsTrigger value="semana">Semana</TabsTrigger>
            <TabsTrigger value="dia">Dia</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <span className="tnum min-w-52 text-right text-base font-semibold capitalize">
            {periodLabel}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Anterior"
            onClick={() => setAnchor((a) => shiftAnchor(a, unit, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnchor(nowISO)}>
            Hoje
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Próximo"
            onClick={() => setAnchor((a) => shiftAnchor(a, unit, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <Legend />

      {view === "mes" && (
        <MonthView
          weeks={buildMonthGrid(anchor, nowISO)}
          postsByDay={postsByDay}
          channels={channels}
        />
      )}
      {view === "semana" && (
        <WeekView
          days={buildWeek(anchor, nowISO)}
          postsByDay={postsByDay}
          channels={channels}
        />
      )}
      {view === "dia" && (
        <DayView
          day={buildDay(anchor, nowISO)}
          postsByDay={postsByDay}
          channels={channels}
        />
      )}
    </>
  )
}

type Channels = ReturnType<typeof usePublisher>["channels"]

function Legend() {
  const states: PostState[] = ["aRevisar", "agendado", "publicado", "falhou"]
  return (
    <div className="text-muted-foreground mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
      {states.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", STATE_DOT[s])} />
          {STATE_LABEL[s]}
        </span>
      ))}
    </div>
  )
}

function MonthView({
  weeks,
  postsByDay,
  channels,
}: {
  weeks: CalendarDay[][]
  postsByDay: Map<string, Post[]>
  channels: Channels
}) {
  return (
    <div className="bg-card ring-foreground/5 overflow-hidden rounded-2xl border shadow-sm ring-1">
      <div className="bg-muted/40 text-muted-foreground grid grid-cols-7 border-b text-center text-sm font-medium">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-3 capitalize">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((day) => {
          const dayPosts = postsByDay.get(day.key) ?? []
          return (
            <div
              key={day.iso}
              className={cn(
                "min-h-32 border-r border-b p-2 last:border-r-0",
                !day.inMonth && "bg-muted/20"
              )}
            >
              <div
                className={cn(
                  "tnum mb-1.5 inline-flex size-7 items-center justify-center rounded-full text-sm",
                  !day.inMonth && "text-muted-foreground",
                  day.isToday &&
                    "bg-primary text-primary-foreground font-semibold"
                )}
              >
                {day.dayNum}
              </div>
              <div className="flex flex-col gap-1">
                {dayPosts.slice(0, 3).map((post) => (
                  <CalendarBlock
                    key={post.content.deliveryId}
                    post={post}
                    channels={channels}
                    variant="month"
                  />
                ))}
                {dayPosts.length > 3 && (
                  <span className="text-muted-foreground px-1 text-[11px] font-medium">
                    +{dayPosts.length - 3} mais
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({
  days,
  postsByDay,
  channels,
}: {
  days: CalendarDay[]
  postsByDay: Map<string, Post[]>
  channels: Channels
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
      {days.map((day) => {
        const dayPosts = postsByDay.get(day.key) ?? []
        return (
          <div
            key={day.iso}
            className={cn(
              "ring-foreground/5 flex min-h-[60vh] flex-col gap-2 rounded-xl border p-2.5 ring-1",
              day.isToday ? "bg-primary/5 ring-primary/30" : "bg-card"
            )}
          >
            <div className="mb-1 flex items-center justify-between px-0.5">
              <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {formatWeekday(day.iso)}
              </span>
              <span
                className={cn(
                  "tnum inline-flex size-7 items-center justify-center rounded-full text-sm font-medium",
                  day.isToday &&
                    "bg-primary text-primary-foreground font-semibold"
                )}
              >
                {day.dayNum}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {dayPosts.length === 0 ? (
                <span className="text-muted-foreground/60 px-0.5 py-2 text-xs">
                  —
                </span>
              ) : (
                dayPosts.map((post) => (
                  <CalendarBlock
                    key={post.content.deliveryId}
                    post={post}
                    channels={channels}
                    variant="week"
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DayView({
  day,
  postsByDay,
  channels,
}: {
  day: CalendarDay
  postsByDay: Map<string, Post[]>
  channels: Channels
}) {
  const dayPosts = postsByDay.get(day.key) ?? []
  return (
    <div className="bg-card ring-foreground/5 mx-auto max-w-3xl rounded-2xl border p-5 shadow-sm ring-1">
      {dayPosts.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          Nenhum post neste dia.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {dayPosts.map((post) => (
            <CalendarBlock
              key={post.content.deliveryId}
              post={post}
              channels={channels}
              variant="day"
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CalendarBlock({
  post,
  channels,
  variant,
}: {
  post: Post
  channels: Channels
  variant: "month" | "week" | "day"
}) {
  const time = formatTime(postTimestamp(post))
  const postChannels = resolveChannels(post.content.channels, channels)
  const href = `/post/${post.content.deliveryId}`

  if (variant === "month") {
    return (
      <Link
        href={href}
        className={cn(
          "bg-muted/50 hover:bg-muted block rounded-md border-l-2 px-1.5 py-1 transition-colors",
          STATE_ACCENT[post.state]
        )}
      >
        <div className="flex items-center gap-1.5">
          <span className="tnum text-[11px] font-semibold">{time}</span>
          <div className="flex -space-x-1">
            {postChannels.slice(0, 3).map((c) => (
              <NetworkMark
                key={c.slug}
                network={c.networkId}
                className="ring-card size-4 rounded-[5px] ring-1"
              />
            ))}
          </div>
        </div>
        <p className="text-card-foreground/75 mt-0.5 truncate text-[11px]">
          {post.content.base.text}
        </p>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        "group bg-card hover:bg-muted/40 block rounded-lg border border-l-[3px] px-2.5 py-2.5 shadow-sm transition-all hover:-translate-y-px hover:shadow-md",
        STATE_ACCENT[post.state]
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="tnum text-sm font-bold">{time}</span>
        <div className="flex -space-x-1.5">
          {postChannels.slice(0, 4).map((c) => (
            <NetworkMark
              key={c.slug}
              network={c.networkId}
              className="ring-card size-5 rounded-[6px] ring-2"
            />
          ))}
        </div>
      </div>
      <p
        className={cn(
          "text-card-foreground/85 mt-1.5 text-xs leading-relaxed",
          variant === "day" ? "line-clamp-3" : "line-clamp-2"
        )}
      >
        {post.content.base.text}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
            STATE_PILL[post.state]
          )}
        >
          {STATE_LABEL[post.state]}
        </span>
        {post.content.autoPublish && (
          <span className="bg-accent text-accent-foreground inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium">
            auto
          </span>
        )}
      </div>
    </Link>
  )
}

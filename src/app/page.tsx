"use client"

import { useState } from "react"
import { Inbox as InboxIcon, Radio, RefreshCw } from "lucide-react"

import type { Post } from "@/domain/post"
import { usePublisher } from "@/store/publisher-store"
import { PageHeader } from "@/components/shell/page-header"
import { PostCard } from "@/components/posts/post-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type Filter = "acao" | "recusados"

/**
 * Inbox = eixo de **ação** (APP-ADR-003): só o que exige decisão humana agora —
 * posts `aRevisar` e `falhou`, numa única lista ordenada por urgência. A flag
 * `rejected` é ortogonal: recusados saem da fila de ação mas seguem visíveis no
 * filtro secundário "Recusados" (nada some em silêncio).
 *
 * Ordem de urgência: falhas primeiro (exigem reação), depois as pendências por
 * proximidade temporal — as agendadas (`schedule.at`) pela proximidade do horário
 * (mais cedo primeiro), e as imediatas (`now`) em seguida.
 */
function urgencyOrder(posts: Post[]): Post[] {
  const active = posts.filter((p) => !p.rejected)
  const failed = active
    .filter((p) => p.state === "falhou")
    .sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    )
  const review = active.filter((p) => p.state === "aRevisar")
  const reviewAt = review
    .filter((p) => p.content.schedule.mode === "at")
    .sort((a, b) => {
      const at = a.content.schedule
      const bt = b.content.schedule
      // ambos são `at` aqui (filtro acima); o narrow é só para o TS.
      const av = at.mode === "at" ? new Date(at.at).getTime() : 0
      const bv = bt.mode === "at" ? new Date(bt.at).getTime() : 0
      return av - bv
    })
  const reviewNow = review.filter((p) => p.content.schedule.mode === "now")
  return [...failed, ...reviewAt, ...reviewNow]
}

export default function InboxPage() {
  const { posts, simulateReceive, refreshInbox } = usePublisher()
  const [filter, setFilter] = useState<Filter>("acao")

  const action = urgencyOrder(posts)
  const rejected = posts.filter((p) => p.rejected)

  const lists: Record<Filter, Post[]> = {
    acao: action,
    recusados: rejected,
  }
  const current = lists[filter]

  return (
    <>
      <PageHeader
        title="Inbox"
        description="O que exige sua decisão agora: falhas e posts a revisar, por urgência."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshInbox}>
              <RefreshCw />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={simulateReceive}>
              <Radio />
              Simular recebimento do MC
            </Button>
          </div>
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="mb-5">
          <TabsTrigger value="acao">
            Ação
            <Count n={action.length} />
          </TabsTrigger>
          <TabsTrigger value="recusados">
            Recusados
            <Count n={rejected.length} tone="muted" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          {current.length === 0 ? (
            <EmptyState filter={filter} onReceive={simulateReceive} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {current.map((post) => (
                <PostCard key={post.content.deliveryId} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}

function Count({
  n,
  tone = "default",
}: {
  n: number
  tone?: "default" | "muted"
}) {
  if (n === 0) return null
  return (
    <span
      className={cn(
        "ml-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[11px] font-semibold",
        tone === "muted"
          ? "bg-muted text-muted-foreground"
          : "bg-primary/15 text-primary"
      )}
    >
      {n}
    </span>
  )
}

function EmptyState({
  filter,
  onReceive,
}: {
  filter: Filter
  onReceive: () => void
}) {
  const copy: Record<Filter, { title: string; body: string }> = {
    acao: {
      title: "Inbox limpa",
      body: "Nada exige sua decisão agora — sem falhas nem posts a revisar. Simule um recebimento do MC para ver a jornada.",
    },
    recusados: {
      title: "Nada recusado",
      body: "Posts que você recusar aparecem aqui — nunca somem em silêncio.",
    },
  }
  const { title, body } = copy[filter]

  return (
    <div className="bg-card/50 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-16 text-center">
      <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-2xl">
        <InboxIcon className="size-6" />
      </span>
      <div>
        <p className="font-heading text-base font-medium">{title}</p>
        <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
          {body}
        </p>
      </div>
      {filter === "acao" && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReceive}
          className="mt-1"
        >
          <Radio />
          Simular recebimento do MC
        </Button>
      )}
    </div>
  )
}

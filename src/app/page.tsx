"use client"

import { useState } from "react"
import { Inbox as InboxIcon, Radio } from "lucide-react"

import { isPublishing, type Post } from "@/domain/post"
import { usePublisher } from "@/store/publisher-store"
import { PageHeader } from "@/components/shell/page-header"
import { PostCard } from "@/components/posts/post-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type Filter = "revisar" | "falhas" | "recusados"

export default function InboxPage() {
  const { posts, simulateReceive } = usePublisher()
  const [filter, setFilter] = useState<Filter>("revisar")

  const review = posts.filter(
    (p) => p.state === "aRevisar" && !p.rejected && !isPublishing(p)
  )
  const publishingNow = posts.filter((p) => isPublishing(p) && !p.rejected)
  const failed = posts.filter((p) => p.state === "falhou" && !p.rejected)
  const rejected = posts.filter((p) => p.rejected)

  const lists: Record<Filter, Post[]> = {
    revisar: [...publishingNow, ...review],
    falhas: failed,
    recusados: rejected,
  }
  const current = lists[filter]

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Posts que o Mission Control empurrou, aguardando sua revisão."
        actions={
          <Button variant="outline" size="sm" onClick={simulateReceive}>
            <Radio />
            Simular recebimento do MC
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="mb-5">
          <TabsTrigger value="revisar">
            A revisar
            <Count n={review.length + publishingNow.length} />
          </TabsTrigger>
          <TabsTrigger value="falhas">
            Falhas
            <Count n={failed.length} tone="failed" />
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
  tone?: "default" | "failed" | "muted"
}) {
  if (n === 0) return null
  return (
    <span
      className={cn(
        "ml-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[11px] font-semibold",
        tone === "failed"
          ? "bg-status-failed text-status-failed-foreground"
          : tone === "muted"
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
    revisar: {
      title: "Inbox limpa",
      body: "Nenhum post aguardando revisão. Simule um recebimento do MC para ver a jornada.",
    },
    falhas: {
      title: "Nenhuma falha",
      body: "Todas as publicações resolveram com sucesso até agora.",
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
      {filter === "revisar" && (
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

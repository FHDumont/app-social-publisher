"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, RotateCcw, Save, Send, Sparkles, X } from "lucide-react"
import { toast } from "sonner"

import type { Channel } from "@/domain/channels"
import {
  resolveChannelBody,
  type ChannelOverride,
  type PostContent,
} from "@/domain/content"
import { NETWORKS } from "@/domain/networks"
import type { Post } from "@/domain/post"
import { isPublishing } from "@/domain/post"
import { isScheduledFuture } from "@/domain/state-machine"
import { usePublisher } from "@/store/publisher-store"
import { MEDIA_LIBRARY } from "@/data/fixtures"
import { NetworkPreview } from "@/components/posts/network-preview"
import { NetworkMark } from "@/components/networks/network-mark"
import { PostStatusBadge } from "@/components/posts/status-badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { resolveChannels } from "@/lib/channels"
import { fromDateTimeLocal, toDateTimeLocal } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Garante que `content.media` tenha exatamente os descritores referenciados. */
function normalize(content: PostContent): PostContent {
  const refs = new Set<string>()
  content.base.media.forEach((m) => refs.add(m.ref))
  Object.values(content.perChannel).forEach((o) =>
    o?.media?.forEach((m) => refs.add(m.ref))
  )
  return { ...content, media: MEDIA_LIBRARY.filter((m) => refs.has(m.ref)) }
}

export function Composer({
  mode,
  initial,
  post,
}: {
  mode: "edit" | "create"
  initial: PostContent
  post?: Post
}) {
  const router = useRouter()
  const {
    channels,
    nowISO,
    updateContent,
    approve,
    reject,
    retry,
    publishScheduledNow,
    createManual,
  } = usePublisher()

  const [content, setContent] = useState<PostContent>(() => normalize(initial))
  const patch = (next: PostContent) => setContent(normalize(next))

  const [previewChannel, setPreviewChannel] = useState(
    content.channels[0] ?? ""
  )

  const selected = resolveChannels(content.channels, channels)
  const activePreview =
    selected.find((c) => c.slug === previewChannel) ?? selected[0]

  function toggleChannel(slug: string) {
    const has = content.channels.includes(slug)
    const channelsNext = has
      ? content.channels.filter((s) => s !== slug)
      : [...content.channels, slug]
    const perChannel = { ...content.perChannel }
    if (has) delete perChannel[slug]
    patch({ ...content, channels: channelsNext, perChannel })
    if (!has) setPreviewChannel(slug)
  }

  function setBaseText(text: string) {
    patch({ ...content, base: { ...content.base, text } })
  }

  function toggleBaseMedia(ref: string) {
    const has = content.base.media.some((m) => m.ref === ref)
    const media = has
      ? content.base.media.filter((m) => m.ref !== ref)
      : [...content.base.media, { ref }]
    patch({ ...content, base: { ...content.base, media } })
  }

  function setSchedule(next: PostContent["schedule"]) {
    patch({ ...content, schedule: next })
  }

  function setAutoPublish(value: boolean) {
    patch({ ...content, autoPublish: value })
  }

  function setOverride(slug: string, override: ChannelOverride | null) {
    const perChannel = { ...content.perChannel }
    if (override === null) delete perChannel[slug]
    else perChannel[slug] = override
    patch({ ...content, perChannel })
  }

  const canSave =
    content.channels.length > 0 && content.base.text.trim().length > 0

  function handleCreate() {
    if (!canSave) return
    createManual(content)
    toast.success("Post criado", {
      description: "Entrou na inbox para revisão.",
    })
    router.push("/")
  }

  function handleSave() {
    if (!post) return
    updateContent(post.content.deliveryId, content)
    toast.success("Alterações salvas")
  }

  function handleApprove() {
    if (!post) return
    updateContent(post.content.deliveryId, content)
    approve(post.content.deliveryId)
    router.push("/")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(360px,420px)]">
      {/* Editor */}
      <div className="flex flex-col gap-5">
        <Section
          title="Texto base"
          hint="Conteúdo canônico, comum a todos os canais."
        >
          <Textarea
            value={content.base.text}
            onChange={(e) => setBaseText(e.target.value)}
            placeholder="Escreva o post…"
            className="min-h-32 resize-y"
          />
        </Section>

        <Section title="Mídia base" hint="Bytes são placeholders nesta fase.">
          <div className="flex flex-wrap gap-2">
            {MEDIA_LIBRARY.map((m) => {
              const on = content.base.media.some((x) => x.ref === m.ref)
              return (
                <button
                  key={m.ref}
                  type="button"
                  onClick={() => toggleBaseMedia(m.ref)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    on
                      ? "border-primary bg-primary/10 text-primary"
                      : "bg-card hover:bg-muted"
                  )}
                >
                  {m.name}
                  <span className="text-muted-foreground ml-1">· {m.kind}</span>
                </button>
              )
            })}
          </div>
        </Section>

        <Section
          title="Canais"
          hint="Onde o post sai. Cada canal pode ter uma versão própria."
        >
          <ChannelPicker
            channels={channels}
            selected={content.channels}
            onToggle={toggleChannel}
          />
        </Section>

        {selected.length > 0 && (
          <Section
            title="Versões por canal"
            hint="Sobrescreva só o que difere da base (ex.: texto curto para X)."
          >
            <div className="flex flex-col gap-2">
              {selected.map((channel) => (
                <OverrideEditor
                  key={channel.slug}
                  channel={channel}
                  content={content}
                  onChange={(ov) => setOverride(channel.slug, ov)}
                />
              ))}
            </div>
          </Section>
        )}

        <Section title="Agendamento">
          <ScheduleEditor
            schedule={content.schedule}
            onChange={setSchedule}
            nowISO={nowISO}
          />
        </Section>

        <Section
          title="Publicação automática"
          hint="Ligado, e com agendamento válido, pula a revisão humana."
        >
          <div className="flex items-center gap-3">
            <Switch
              checked={content.autoPublish}
              onCheckedChange={setAutoPublish}
              aria-label="Publicação automática"
            />
            <span className="text-muted-foreground text-sm">
              {content.autoPublish
                ? "Automático — publica sem aprovação."
                : "Revisão humana — exige aprovação na inbox."}
            </span>
          </div>
        </Section>

        <ActionBar
          mode={mode}
          post={post}
          canSave={canSave}
          isPublishingPost={post ? isPublishing(post) : false}
          isFuture={isScheduledFuture(content, nowISO)}
          onCreate={handleCreate}
          onSave={handleSave}
          onApprove={handleApprove}
          onReject={() => {
            if (!post) return
            reject(post.content.deliveryId)
            router.push("/")
          }}
          onRetry={() => post && retry(post.content.deliveryId)}
          onPublishNow={() =>
            post && publishScheduledNow(post.content.deliveryId)
          }
        />
      </div>

      {/* Preview por-rede */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="text-primary size-4" />
          <h2 className="font-heading text-sm font-semibold">
            Preview por-rede
          </h2>
        </div>
        {selected.length === 0 ? (
          <div className="bg-card/50 text-muted-foreground rounded-xl border border-dashed px-4 py-12 text-center text-sm">
            Selecione ao menos um canal para ver o preview.
          </div>
        ) : (
          <Tabs value={activePreview?.slug} onValueChange={setPreviewChannel}>
            <TabsList variant="line" className="mb-3 flex-wrap">
              {selected.map((c) => (
                <TabsTrigger key={c.slug} value={c.slug}>
                  <NetworkMark
                    network={c.networkId}
                    size="sm"
                    className="size-4"
                  />
                  <span className="max-w-24 truncate">{c.accountName}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {activePreview && (
              <TabsContent value={activePreview.slug}>
                <NetworkPreview content={content} channel={activePreview} />
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-card ring-foreground/5 rounded-2xl border p-4 shadow-sm ring-1">
      <div className="mb-3">
        <h3 className="font-heading text-sm font-semibold">{title}</h3>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function ChannelPicker({
  channels,
  selected,
  onToggle,
}: {
  channels: Channel[]
  selected: string[]
  onToggle: (slug: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {channels.map((channel) => {
        const net = NETWORKS[channel.networkId]
        const on = selected.includes(channel.slug)
        return (
          <button
            key={channel.slug}
            type="button"
            onClick={() => onToggle(channel.slug)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
              on ? "text-white" : "bg-card hover:bg-muted",
              !channel.connected && "opacity-60"
            )}
            style={
              on
                ? { backgroundColor: net.brand, borderColor: net.brand }
                : undefined
            }
          >
            <NetworkMark
              network={channel.networkId}
              size="sm"
              className={cn("size-4", on && "bg-white/20")}
            />
            {channel.accountName}
            {on && <Check className="size-3.5" />}
          </button>
        )
      })}
    </div>
  )
}

function OverrideEditor({
  channel,
  content,
  onChange,
}: {
  channel: Channel
  content: PostContent
  onChange: (override: ChannelOverride | null) => void
}) {
  const override = content.perChannel[channel.slug]
  const on = Boolean(override)
  const effective = resolveChannelBody(content, channel.slug)

  return (
    <div className="bg-background/40 rounded-xl border p-3">
      <div className="flex items-center gap-2.5">
        <NetworkMark network={channel.networkId} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{channel.accountName}</p>
          <p className="text-muted-foreground truncate text-xs">
            {on ? "Versão própria deste canal" : "Usando o texto base"}
          </p>
        </div>
        <Label className="text-muted-foreground text-xs">Personalizar</Label>
        <Switch
          size="sm"
          checked={on}
          onCheckedChange={(checked) =>
            onChange(checked ? { text: effective.text } : null)
          }
          aria-label={`Personalizar ${channel.accountName}`}
        />
      </div>
      {on && (
        <div className="mt-3 flex flex-col gap-3">
          <Textarea
            value={override?.text ?? ""}
            onChange={(e) => onChange({ ...override, text: e.target.value })}
            placeholder="Texto específico deste canal…"
            className="min-h-20 resize-y text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {MEDIA_LIBRARY.map((m) => {
              const mediaList = override?.media ?? content.base.media
              const sel = mediaList.some((x) => x.ref === m.ref)
              return (
                <button
                  key={m.ref}
                  type="button"
                  onClick={() => {
                    const base = override?.media ?? content.base.media
                    const next = sel
                      ? base.filter((x) => x.ref !== m.ref)
                      : [...base, { ref: m.ref }]
                    onChange({ ...override, media: next })
                  }}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                    sel
                      ? "border-primary bg-primary/10 text-primary"
                      : "bg-card hover:bg-muted"
                  )}
                >
                  {m.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ScheduleEditor({
  schedule,
  onChange,
  nowISO,
}: {
  schedule: PostContent["schedule"]
  onChange: (next: PostContent["schedule"]) => void
  nowISO: string
}) {
  const isAt = schedule.mode === "at"
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <ModeButton
          active={!isAt}
          onClick={() => onChange({ mode: "now" })}
          label="Imediato"
        />
        <ModeButton
          active={isAt}
          onClick={() =>
            onChange({
              mode: "at",
              at:
                schedule.mode === "at"
                  ? schedule.at
                  : new Date(
                      new Date(nowISO).getTime() + 3600_000
                    ).toISOString(),
            })
          }
          label="Agendar"
        />
      </div>
      {isAt && (
        <input
          type="datetime-local"
          value={toDateTimeLocal(schedule.at)}
          onChange={(e) =>
            onChange({ mode: "at", at: fromDateTimeLocal(e.target.value) })
          }
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 w-fit rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3"
        />
      )}
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "bg-card hover:bg-muted"
      )}
    >
      {label}
    </button>
  )
}

function ActionBar({
  mode,
  post,
  canSave,
  isPublishingPost,
  isFuture,
  onCreate,
  onSave,
  onApprove,
  onReject,
  onRetry,
  onPublishNow,
}: {
  mode: "edit" | "create"
  post?: Post
  canSave: boolean
  isPublishingPost: boolean
  isFuture: boolean
  onCreate: () => void
  onSave: () => void
  onApprove: () => void
  onReject: () => void
  onRetry: () => void
  onPublishNow: () => void
}) {
  return (
    <div className="bg-card/95 ring-foreground/5 sticky bottom-0 flex flex-wrap items-center gap-2 rounded-2xl border p-3 shadow-sm ring-1 backdrop-blur">
      {post && <PostStatusBadge post={post} />}
      <div className="flex-1" />

      {mode === "create" && (
        <Button onClick={onCreate} disabled={!canSave}>
          <Check />
          Criar post
        </Button>
      )}

      {mode === "edit" && post && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={!canSave}
          >
            <Save />
            Salvar
          </Button>

          {!isPublishingPost && post.state === "aRevisar" && !post.rejected && (
            <>
              <Button variant="ghost" size="sm" onClick={onReject}>
                <X />
                Recusar
              </Button>
              <Button size="sm" onClick={onApprove} disabled={!canSave}>
                <Check />
                {isFuture ? "Aprovar e agendar" : "Aprovar e publicar"}
              </Button>
            </>
          )}

          {!isPublishingPost && post.state === "agendado" && (
            <Button size="sm" onClick={onPublishNow}>
              <Send />
              Publicar agora
            </Button>
          )}

          {!isPublishingPost && post.state === "falhou" && (
            <Button size="sm" onClick={onRetry}>
              <RotateCcw />
              Tentar novamente
            </Button>
          )}

          {isPublishingPost && (
            <span className="text-muted-foreground text-sm">Publicando…</span>
          )}
        </>
      )}
    </div>
  )
}

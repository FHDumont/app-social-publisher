import { CircleAlert, TriangleAlert } from "lucide-react"

import type { Channel } from "@/domain/channels"
import {
  resolveChannelBody,
  resolveChannelMedia,
  type PostContent,
} from "@/domain/content"
import { NETWORKS, validateBodyForNetwork } from "@/domain/networks"
import { NetworkMark } from "@/components/networks/network-mark"
import { MediaPlaceholder } from "@/components/posts/media-placeholder"
import { cn } from "@/lib/utils"

/**
 * Render de um post como ele sai em UM canal: aplica o override sobre a base e
 * respeita o descritor de capacidade da rede (layout de mídia, limite de texto).
 * Mostra a validação por-rede inline — nada de erro silencioso.
 */
export function NetworkPreview({
  content,
  channel,
  className,
}: {
  content: PostContent
  channel: Channel
  className?: string
}) {
  const net = NETWORKS[channel.networkId]
  const body = resolveChannelBody(content, channel.slug)
  const media = resolveChannelMedia(content, channel.slug)
  const issues = validateBodyForNetwork(body, net, media)
  const hasOverride = Boolean(content.perChannel[channel.slug])

  const chars = body.text.length
  const max = net.capability.maxChars
  const over = max !== null && chars > max

  return (
    <div
      className={cn(
        "bg-card flex flex-col overflow-hidden rounded-xl border",
        className
      )}
    >
      {/* Cabeçalho do "feed" */}
      <div className="flex items-center gap-2.5 px-4 pt-4">
        <NetworkMark network={channel.networkId} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">
            {channel.accountName}
          </p>
          <p className="text-muted-foreground truncate text-xs">
            {channel.handle}
          </p>
        </div>
        <span className="text-muted-foreground text-[11px] font-medium">
          {net.name}
        </span>
      </div>

      {/* Texto */}
      <div className="px-4 pt-3">
        {body.text ? (
          <p className="text-card-foreground/90 text-sm whitespace-pre-wrap">
            {body.text}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm italic">(sem texto)</p>
        )}
        {hasOverride && (
          <p className="text-primary mt-1.5 text-[11px] font-medium">
            • versão específica deste canal
          </p>
        )}
      </div>

      {/* Mídia */}
      {media.length > 0 && (
        <div className="px-4 pt-3">
          <MediaLayout networkId={channel.networkId} media={media} />
        </div>
      )}

      {/* Rodapé: contagem + validação */}
      <div className="bg-muted/40 mt-3 flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5">
        <span
          className={cn(
            "tnum text-xs",
            over
              ? "text-status-failed-foreground font-semibold"
              : "text-muted-foreground"
          )}
        >
          {chars.toLocaleString("pt-BR")}
          {max !== null ? ` / ${max.toLocaleString("pt-BR")}` : " caracteres"}
        </span>
        <span className="text-muted-foreground text-xs">
          {media.length} mídia{media.length === 1 ? "" : "s"} · máx{" "}
          {net.capability.maxMedia}
        </span>
      </div>

      {issues.length > 0 && (
        <ul className="flex flex-col gap-1 border-t px-4 py-2.5">
          {issues.map((issue, i) => (
            <li
              key={i}
              className={cn(
                "flex items-start gap-1.5 text-xs",
                issue.level === "error"
                  ? "text-status-failed-foreground"
                  : "text-status-review-foreground"
              )}
            >
              {issue.level === "error" ? (
                <CircleAlert className="mt-px size-3.5 shrink-0" />
              ) : (
                <TriangleAlert className="mt-px size-3.5 shrink-0" />
              )}
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MediaLayout({
  networkId,
  media,
}: {
  networkId: Channel["networkId"]
  media: ReturnType<typeof resolveChannelMedia>
}) {
  if (networkId === "instagram") {
    // Carrossel quadrado: primeira mídia em destaque + tira.
    return (
      <div className="flex flex-col gap-2">
        <MediaPlaceholder media={media[0]} aspect="square" />
        {media.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {media.slice(1).map((m, i) => (
              <MediaPlaceholder
                key={i}
                media={m}
                aspect="square"
                className="size-16 shrink-0"
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (networkId === "youtube") {
    return <MediaPlaceholder media={media[0]} aspect="video" />
  }

  if (networkId === "wordpress") {
    return (
      <div className="flex flex-col gap-2">
        {media.map((m, i) => (
          <MediaPlaceholder key={i} media={m} aspect="video" />
        ))}
      </div>
    )
  }

  // LinkedIn / X: 1 mídia grande, ou grade 2-col.
  if (media.length === 1) {
    return <MediaPlaceholder media={media[0]} aspect="video" />
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {media.map((m, i) => (
        <MediaPlaceholder key={i} media={m} aspect="square" />
      ))}
    </div>
  )
}

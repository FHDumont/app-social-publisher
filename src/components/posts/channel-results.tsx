import { ExternalLink } from "lucide-react"

import type { Channel } from "@/domain/channels"
import type { Post } from "@/domain/post"
import { ChannelStatusIcon } from "@/components/posts/status-badge"
import { NetworkMark } from "@/components/networks/network-mark"
import { channelOrPlaceholder } from "@/lib/channels"

/** Lista o resultado de publicação por canal (URL no sucesso, motivo na falha). */
export function ChannelResults({
  post,
  channels,
}: {
  post: Post
  channels: Channel[]
}) {
  if (post.channelResults.length === 0) return null

  return (
    <ul className="flex flex-col gap-1.5">
      {post.channelResults.map((result) => {
        const channel = channelOrPlaceholder(result.channel, channels)
        return (
          <li
            key={result.channel}
            className="bg-card flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm"
          >
            <NetworkMark network={channel.networkId} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{channel.accountName}</p>
              {result.status === "falhou" && result.error && (
                <p className="text-status-failed-foreground truncate text-xs">
                  {result.error}
                </p>
              )}
              {result.status === "publicado" && result.publishedUrl && (
                <a
                  href={result.publishedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-xs hover:underline"
                >
                  {result.publishedUrl.replace("https://", "")}
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
            <ChannelStatusIcon status={result.status} />
          </li>
        )
      })}
    </ul>
  )
}

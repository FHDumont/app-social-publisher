import type { Channel } from "@/domain/channels"
import { NETWORKS, type NetworkId } from "@/domain/networks"
import { NetworkGlyph } from "@/components/networks/network-glyph"
import { cn } from "@/lib/utils"

/** Quadradinho com a cor de marca + glifo da rede. */
export function NetworkMark({
  network,
  size = "md",
  className,
}: {
  network: NetworkId
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const net = NETWORKS[network]
  const sizeClass =
    size === "sm" ? "size-6" : size === "lg" ? "size-10" : "size-8"
  const glyphClass =
    size === "sm" ? "size-3" : size === "lg" ? "size-5" : "size-4"
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg text-white shadow-sm",
        sizeClass,
        className
      )}
      style={{ backgroundColor: net.brand }}
      title={net.name}
    >
      <NetworkGlyph network={network} className={glyphClass} />
    </span>
  )
}

/** Chip com glifo + nome da conta, na cor de marca (tom suave). */
export function ChannelChip({
  channel,
  className,
}: {
  channel: Channel
  className?: string
}) {
  const net = NETWORKS[channel.networkId]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        className
      )}
      style={{
        borderColor: `${net.brand}33`,
        backgroundColor: `${net.brand}14`,
        color: net.brand,
      }}
    >
      <NetworkGlyph network={channel.networkId} className="size-3" />
      <span className="text-foreground/80">{channel.accountName}</span>
    </span>
  )
}

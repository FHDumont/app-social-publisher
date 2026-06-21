import type { Channel } from "@/domain/channels"

/** Resolve slugs → canais conhecidos (ignora slugs sem correspondência). */
export function resolveChannels(
  slugs: string[],
  channels: Channel[]
): Channel[] {
  return slugs
    .map((slug) => channels.find((c) => c.slug === slug))
    .filter((c): c is Channel => Boolean(c))
}

/** Um canal "fantasma" para slugs sem correspondência (defensivo). */
export function channelOrPlaceholder(
  slug: string,
  channels: Channel[]
): Channel {
  return (
    channels.find((c) => c.slug === slug) ?? {
      slug,
      networkId: "wordpress",
      accountName: slug,
      handle: slug,
      connected: false,
    }
  )
}

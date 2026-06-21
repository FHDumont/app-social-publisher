import type { PostContent } from "@/domain/content"
import type { ChannelResult } from "@/domain/post"

/**
 * Fronteira de publicação. Uma rede/canal recebe o conteúdo e devolve sucesso ou
 * erro. Trocar mock→real depois é implementar esta interface com chamadas reais
 * (OAuth + API de cada rede) — sem redesenho do resto do app.
 */
export interface Publisher {
  publish(channel: string, content: PostContent): Promise<ChannelResult>
}

export interface MockPublisherOptions {
  /** Canais (slugs) que sempre falham — para exercitar o caminho de falha. */
  failChannels?: Iterable<string>
  /** Latência simulada por canal (ms). */
  latencyMs?: number
}

/**
 * Publicador falso. Resolve cada canal em `publicado` (com URL fake) ou `falhou`
 * (com motivo), de forma determinística conforme `failChannels`.
 */
export class MockPublisher implements Publisher {
  private readonly failChannels: Set<string>
  private readonly latencyMs: number

  constructor(options: MockPublisherOptions = {}) {
    this.failChannels = new Set(options.failChannels ?? [])
    this.latencyMs = options.latencyMs ?? 900
  }

  async publish(channel: string, content: PostContent): Promise<ChannelResult> {
    await delay(this.latencyMs)

    if (this.failChannels.has(channel)) {
      return {
        channel,
        status: "falhou",
        error: "Conta sem permissão de publicação (token expirado). [mock]",
      }
    }

    return {
      channel,
      status: "publicado",
      publishedUrl: fakePublishedUrl(channel, content),
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function fakePublishedUrl(channel: string, content: PostContent): string {
  const slug = content.deliveryId.slice(0, 8)
  return `https://exemplo.local/${channel}/post/${slug}`
}

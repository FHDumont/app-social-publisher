import { postContentSchema, type PostContent } from "@/domain/content"

/**
 * Fronteira de recepção. O publisher é receptor puro (Modo B): nunca submete job
 * nem faz polling — o MC empurra `content` pronto por push agendado.
 *
 * O invólucro do push (formato do corpo, id consultável, headers) é território do
 * MC e NÃO é fixado aqui (3 pontos abertos na §6.B do manual de integração). Esta
 * interface modela só o que é deste app: "chegou um `content` válido, processe".
 * Trocar mock→real depois = implementar `start` com um webhook/endpoint real que
 * valida o invólucro e chama `onContent` com o `content` interno.
 */
export interface ReceiverEvents {
  onContent: (content: PostContent) => void
  /** `content` recebido mas inválido contra o schema v1 — nunca silencioso. */
  onInvalid?: (raw: unknown, error: string) => void
}

export interface Receiver {
  start(events: ReceiverEvents): void
  stop(): void
}

/**
 * Receptor falso: simula a chegada de pushes do MC. `simulate` valida o payload
 * pelo `postContentSchema` (a mesma fronteira do receptor real) antes de entregar.
 * Sem payload, sorteia um do pool rotativo de fixtures `origin:"mc"`.
 */
export class MockReceiver implements Receiver {
  private events: ReceiverEvents | null = null
  private cursor = 0
  private readonly pool: PostContent[]
  private readonly now: () => string

  constructor(
    pool: PostContent[],
    now: () => string = () => new Date().toISOString()
  ) {
    this.pool = pool
    this.now = now
  }

  start(events: ReceiverEvents): void {
    this.events = events
  }

  stop(): void {
    this.events = null
  }

  /** Simula um push do MC. Retorna o `content` entregue, ou `null` se inválido. */
  simulate(raw?: unknown): PostContent | null {
    if (!this.events) return null

    const payload = raw ?? this.nextFromPool()
    const parsed = postContentSchema.safeParse(payload)

    if (!parsed.success) {
      this.events.onInvalid?.(payload, parsed.error.message)
      return null
    }

    this.events.onContent(parsed.data)
    return parsed.data
  }

  private nextFromPool(): PostContent {
    const base = this.pool[this.cursor % this.pool.length]
    this.cursor += 1
    // Cada simulação é uma "nova" entrega: id e createdAt frescos para não colidir.
    return {
      ...base,
      deliveryId: crypto.randomUUID(),
      createdAt: this.now(),
    }
  }
}

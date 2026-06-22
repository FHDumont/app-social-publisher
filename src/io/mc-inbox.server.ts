import type { PostContent } from "@/domain/content"
import type { Post } from "@/domain/post"
import { decideOnReceive } from "@/domain/state-machine"
import type { InboxError, WirePost } from "@/io/mc-inbox-wire"
import { parseMcWrapper } from "@/io/mc-wrapper"

/**
 * Inbox **em memória no servidor** dos posts recebidos do MC (mc→app).
 *
 * Por que existe: a inbox de F-001 vive no cliente (React Context); o
 * `POST /mc/callback` é server-side e não compartilha memória com nenhuma aba. Este
 * singleton de processo é o ponto onde a rota grava e o `GET /mc/inbox` lê — a ponte
 * server→client (APP-ADR-002).
 *
 * Limitações desta fase (registradas em DEBITO-TECNICO): estado **só em memória** —
 * some no restart (BD ainda indefinido, D-006); e **sem orquestração de publicação**
 * aqui (o `MockPublisher` é client-side) — posts `autoPublish` caem em `aRevisar`.
 *
 * Server-only: importe apenas de route handlers. (Mantido em `globalThis` para
 * sobreviver ao HMR do `next dev`, que reavalia módulos.)
 */

interface InboxStore {
  posts: Map<string, Post>
  errors: InboxError[]
  seq: number
}

const GLOBAL_KEY = Symbol.for("app-social-publisher.mc-inbox")

function store(): InboxStore {
  const g = globalThis as unknown as { [GLOBAL_KEY]?: InboxStore }
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = { posts: new Map(), errors: [], seq: 0 }
  }
  return g[GLOBAL_KEY]
}

export type IngestOutcome =
  | { status: "accepted"; deliveryId: string; ignoredFiles: number }
  | { status: "duplicate"; deliveryId: string }
  | { status: "invalid"; reason: string }

/**
 * Processa um corpo cru recebido no callback: parseia o invólucro (defensivo),
 * deduplica por `deliveryId` e injeta o post via `decideOnReceive` — o mesmo
 * pipeline da inbox de F-001. Erro sempre visível (log + lista consultável).
 */
export function ingest(rawText: string): IngestOutcome {
  const s = store()
  const nowISO = new Date().toISOString()

  let body: unknown
  try {
    body = JSON.parse(rawText)
  } catch {
    return recordInvalid("corpo não é JSON válido", nowISO)
  }

  const parsed = parseMcWrapper(body)
  if (parsed.ignoredFiles > 0) {
    console.info(
      `[mc/inbox] ${parsed.ignoredFiles} file part(s) ignorada(s) — mídia chega em F-mídia`
    )
  }

  if (!parsed.ok) {
    return recordInvalid(parsed.reason, nowISO)
  }

  const content = parsed.content
  if (s.posts.has(content.deliveryId)) {
    console.info(
      `[mc/inbox] entrega duplicada ignorada (deliveryId=${content.deliveryId})`
    )
    return { status: "duplicate", deliveryId: content.deliveryId }
  }

  s.posts.set(content.deliveryId, buildPost(content, nowISO))
  console.info(
    `[mc/inbox] post aceito (deliveryId=${content.deliveryId}, source=${parsed.source}, channels=${content.channels.join(",")})`
  )
  return {
    status: "accepted",
    deliveryId: content.deliveryId,
    ignoredFiles: parsed.ignoredFiles,
  }
}

function buildPost(content: PostContent, nowISO: string): Post {
  // Reusa a máquina de estados de F-001 (não a altera). `publishNow` não é
  // orquestrado aqui (publisher é client-side) — o post fica no estado de repouso.
  const decision = decideOnReceive(content, nowISO)
  return {
    content,
    state: decision.state,
    channelResults: content.channels.map((channel) => ({
      channel,
      status: "pendente",
    })),
    receivedAt: nowISO,
    rejected: false,
  }
}

function recordInvalid(reason: string, nowISO: string): IngestOutcome {
  const s = store()
  s.seq += 1
  const error: InboxError = { id: `e${s.seq}`, reason, at: nowISO }
  s.errors.push(error)
  console.error(`[mc/inbox] entrega inválida: ${reason}`)
  return { status: "invalid", reason }
}

/** Snapshot serializável para o `GET /mc/inbox`. */
export function snapshot(): { posts: WirePost[]; errors: InboxError[] } {
  const s = store()
  return {
    posts: [...s.posts.values()],
    errors: [...s.errors],
  }
}

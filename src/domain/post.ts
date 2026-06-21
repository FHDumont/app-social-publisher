import type { PostContent, Schedule } from "@/domain/content"

/**
 * Estado local do post no publisher (a máquina de estados real vive em
 * `state-machine.ts`). São os estados de repouso/terminais do ciclo de publicação.
 */
export const POST_STATES = [
  "aRevisar",
  "agendado",
  "publicado",
  "falhou",
] as const
export type PostState = (typeof POST_STATES)[number]

/**
 * Status por canal. `publicando` é transitório (publicação em voo) e é o que
 * dispara o indicador de "publicando…" na UI, ortogonal ao `PostState`.
 */
export const CHANNEL_STATUSES = [
  "pendente",
  "publicando",
  "publicado",
  "falhou",
] as const
export type ChannelPublishStatus = (typeof CHANNEL_STATUSES)[number]

/** Resultado da publicação (mock) por canal. Falha sempre carrega o motivo. */
export interface ChannelResult {
  /** Slug do canal. */
  channel: string
  status: ChannelPublishStatus
  publishedUrl?: string
  error?: string
}

/** O post como vive no publisher: `content` v1 + estado local + resultados. */
export interface Post {
  content: PostContent
  state: PostState
  channelResults: ChannelResult[]
  /** Quando entrou na inbox do publisher (ISO-8601). */
  receivedAt: string
  /**
   * Marca de "recusado" por revisão humana. Mantido visível (filtro Recusados),
   * nunca some em silêncio; reversível por "restaurar".
   */
  rejected: boolean
}

/** Há publicação em voo neste post? (qualquer canal `publicando`). */
export function isPublishing(post: Post): boolean {
  return post.channelResults.some((r) => r.status === "publicando")
}

/**
 * Instante de referência do post na timeline/calendário:
 * - `at` → o horário agendado;
 * - `now` → quando publicou (último resultado) ou quando foi criado.
 */
export function postTimestamp(post: Post): string {
  const schedule: Schedule = post.content.schedule
  if (schedule.mode === "at") return schedule.at
  return post.content.createdAt
}

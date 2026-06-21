import type { PostContent } from "@/domain/content"
import type { ChannelResult, PostState } from "@/domain/post"

/**
 * Máquina de estados real do publisher (I/O à parte — a publicação real é mock
 * nesta fase, mas as transições são reais).
 *
 * Regra central:
 * - Todo post entra em `aRevisar`.
 * - Só pula a mão humana se `autoPublish === true` E `schedule` válido.
 * - `schedule.mode === "at"` no futuro ⇒ `agendado` (aparece no calendário).
 * - `now` (ou `at` já vencido) ⇒ publica ao receber/aprovar.
 * - Publicação resolve cada canal em `publicado` ou `falhou`; qualquer falha
 *   leva o post a `falhou` — nunca silenciosa.
 */

/** `autoPublish` libera automático (default ausente/false ⇒ revisão humana). */
export function isAutomatic(content: PostContent): boolean {
  return content.autoPublish === true
}

/** O agendamento aponta para um instante ainda no futuro? */
export function isScheduledFuture(
  content: PostContent,
  nowISO: string
): boolean {
  return (
    content.schedule.mode === "at" &&
    new Date(content.schedule.at).getTime() > new Date(nowISO).getTime()
  )
}

/** Deve publicar imediatamente? (`now`, ou `at` já vencido). */
export function isDueNow(content: PostContent, nowISO: string): boolean {
  if (content.schedule.mode === "now") return true
  return new Date(content.schedule.at).getTime() <= new Date(nowISO).getTime()
}

/**
 * Resultado de uma decisão da máquina: o estado de repouso resultante e se o
 * orquestrador (store) deve disparar a publicação agora.
 */
export interface Decision {
  state: PostState
  publishNow: boolean
}

/**
 * Estado de um post recém-recebido.
 * - não-auto → `aRevisar` (aguarda humano).
 * - auto + futuro → `agendado`.
 * - auto + vencido/now → dispara publicação (estado de repouso `aRevisar` até o
 *   resultado; o store inicia a publicação no mesmo tick e o post sai da fila
 *   humana por estar `publicando`).
 */
export function decideOnReceive(
  content: PostContent,
  nowISO: string
): Decision {
  if (!isAutomatic(content)) {
    return { state: "aRevisar", publishNow: false }
  }
  if (isScheduledFuture(content, nowISO)) {
    return { state: "agendado", publishNow: false }
  }
  return { state: "aRevisar", publishNow: true }
}

/**
 * Decisão ao aprovar um post em revisão (ação humana).
 * - agendado para o futuro → `agendado`.
 * - `now` / vencido → publica.
 */
export function decideOnApprove(
  content: PostContent,
  nowISO: string
): Decision {
  if (isScheduledFuture(content, nowISO)) {
    return { state: "agendado", publishNow: false }
  }
  return { state: "aRevisar", publishNow: true }
}

/**
 * Estado terminal após a publicação resolver todos os canais.
 * Qualquer canal `falhou` ⇒ post `falhou` (falha visível).
 */
export function settleState(results: ChannelResult[]): PostState {
  const anyFailed = results.some((r) => r.status === "falhou")
  return anyFailed ? "falhou" : "publicado"
}

/** Um post em `falhou` pode ser republicado (retry dos canais que falharam). */
export function canRetry(state: PostState): boolean {
  return state === "falhou"
}

/** Um post `agendado` cujo horário chegou deve publicar. */
export function isScheduleDue(content: PostContent, nowISO: string): boolean {
  return content.schedule.mode === "at" && isDueNow(content, nowISO)
}

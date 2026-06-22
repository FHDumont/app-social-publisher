import { z } from "zod"

import { postContentSchema } from "@/domain/content"
import { CHANNEL_STATUSES, POST_STATES } from "@/domain/post"

/**
 * Contrato de fio (wire) do `GET /mc/inbox` — a ponte server→client da recepção
 * real do MC (a inbox de F-001 é client-side; o endpoint é server-side; ver
 * APP-ADR-002). Schema único, fonte da verdade dos dois lados: o route serializa
 * por aqui e o cliente valida por aqui (I/O validado com Zod, como manda CONVENCOES).
 */

const channelResultSchema = z.object({
  channel: z.string().min(1),
  status: z.enum(CHANNEL_STATUSES),
  publishedUrl: z.string().optional(),
  error: z.string().optional(),
})

/** Um post recebido, no formato em que cruza a fronteira HTTP. */
export const wirePostSchema = z.object({
  content: postContentSchema,
  state: z.enum(POST_STATES),
  channelResults: z.array(channelResultSchema),
  receivedAt: z.iso.datetime(),
  rejected: z.boolean(),
})
export type WirePost = z.infer<typeof wirePostSchema>

/** Uma entrega recusada (content não reconhecido) — erro visível e consultável. */
export const inboxErrorSchema = z.object({
  /** Id estável para o cliente deduplicar quais erros já mostrou. */
  id: z.string().min(1),
  reason: z.string().min(1),
  at: z.iso.datetime(),
})
export type InboxError = z.infer<typeof inboxErrorSchema>

/** Resposta completa do `GET /mc/inbox`. */
export const inboxResponseSchema = z.object({
  posts: z.array(wirePostSchema),
  errors: z.array(inboxErrorSchema),
})
export type InboxResponse = z.infer<typeof inboxResponseSchema>

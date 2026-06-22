import { snapshot } from "@/io/mc-inbox.server"
import type { InboxResponse } from "@/io/mc-inbox-wire"

/**
 * `GET /mc/inbox` — ponte server→client da recepção real (APP-ADR-002).
 *
 * Devolve os posts recebidos do MC (que vivem no inbox em memória do servidor) e a
 * lista de entregas inválidas (erro visível e consultável). O cliente faz polling
 * leve disto e mescla na inbox de F-001. Não cacheia (estado muda a cada push).
 */

export const dynamic = "force-dynamic"

export function GET(): Response {
  const { posts, errors } = snapshot()
  const body: InboxResponse = { posts, errors }
  return Response.json(body, {
    headers: { "cache-control": "no-store" },
  })
}

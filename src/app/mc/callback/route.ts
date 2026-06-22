import { ingest } from "@/io/mc-inbox.server"

/**
 * `POST /mc/callback` — receptor real do push do MC (mc→app, Modo B).
 *
 * Valida o `Authorization: Bearer` contra `MC_APP_TOKEN` (env; nunca hardcoded),
 * loga o corpo cru (revela o formato real do invólucro — §6.B em aberto), responde
 * **`202` rápido** e processa **assíncrono** (não bloqueia a resposta; downstream
 * mais pesado, ex. mídia, chega em fases futuras). O parse/dedup/injeção vive em
 * `mc-inbox.server`. Token errado → `401`; env ausente → `503` (visível).
 */

export const dynamic = "force-dynamic"

export async function POST(req: Request): Promise<Response> {
  const expected = process.env.MC_APP_TOKEN
  if (!expected) {
    console.error(
      "[mc/callback] MC_APP_TOKEN não configurado — defina no .env.local (ver README)"
    )
    return Response.json(
      { error: "receptor não configurado (MC_APP_TOKEN ausente)" },
      { status: 503 }
    )
  }

  const auth = req.headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : ""
  if (!token || token !== expected) {
    console.warn("[mc/callback] 401 — token ausente ou inválido")
    return Response.json({ error: "não autorizado" }, { status: 401 })
  }

  const rawText = await req.text()
  // Log do corpo cru: é o que revela o formato real do invólucro do MC.
  console.info("[mc/callback] corpo cru recebido:", rawText)

  // Responde rápido e processa fora do caminho da resposta (não bloqueia o MC).
  queueMicrotask(() => {
    try {
      ingest(rawText)
    } catch (err) {
      console.error("[mc/callback] erro ao processar entrega:", err)
    }
  })

  return Response.json({ accepted: true }, { status: 202 })
}

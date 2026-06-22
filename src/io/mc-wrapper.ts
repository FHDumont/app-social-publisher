import { postContentSchema, type PostContent } from "@/domain/content"

/**
 * Parser defensivo do invólucro do push do MC (mc→app).
 *
 * O **formato do invólucro** é território do MC e não está fixado aqui (§6.B do
 * manual). Só o campo `content` (v1) é deste app e está travado em
 * `src/domain/content.ts`. Por isso localizamos o `content` em mais de um lugar
 * plausível e validamos pelo `postContentSchema` — a verdade do formato vem do
 * teste de ponta a ponta, não de uma suposição.
 *
 * Formato real confirmado pelo teste (job concluído):
 *   { jobId, status, output: [ { type:"text", content:"<JSON v1 como string>" } ] }
 * Ou seja: o `content` vem como **string JSON** dentro de um item de `output`, e o
 * `type` do item é `"text"` (não `"post"`). O parser cobre esse caso e os anteriores.
 *
 * Nada é descartado em silêncio: quando não casa, devolvemos o motivo (erro
 * visível); `file` parts (mídia) são contadas e ignoradas (chega em F-mídia).
 */

/** Onde, dentro do invólucro, o `content` válido foi encontrado. */
export type ContentSource =
  | "body.content"
  | "body.output[].content"
  | "body.output[]"
  | "body"

export type ParseResult =
  | {
      ok: true
      content: PostContent
      /** Local onde o `content` casou — pista do formato real do invólucro. */
      source: ContentSource
      /** Nº de `file` parts ignoradas (mídia chega em F-mídia). */
      ignoredFiles: number
    }
  | {
      ok: false
      /** Motivo legível da recusa (erro visível, nunca silencioso). */
      reason: string
      ignoredFiles: number
    }

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

/** Conta itens `type:"file"` em `body.output` (ignorados nesta fase). */
function countFileParts(body: unknown): number {
  if (!isRecord(body) || !Array.isArray(body.output)) return 0
  return body.output.filter((item) => isRecord(item) && item.type === "file")
    .length
}

/**
 * Coage um candidato a objeto-`content`: o MC entrega o `content` como **string
 * JSON**, então aqui parseamos. Se já é objeto, devolve como está; string que não
 * parseia (ou outro tipo) → `undefined` (candidato descartado, não é erro fatal).
 */
function asContentObject(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }
  return value
}

/**
 * Candidatos a `content`, em ordem de hipótese. O primeiro que validar contra o
 * schema v1 vence. `file` parts são puladas (contadas à parte).
 */
function* candidates(
  body: unknown
): Generator<{ value: unknown; source: ContentSource }> {
  if (isRecord(body)) {
    // Hipótese 1: campo `content` no topo do corpo.
    if ("content" in body) yield { value: body.content, source: "body.content" }

    // Hipótese 2: itens de `output` (o formato real do MC). Pula `file` (mídia);
    // para os demais, o `content` do item (string JSON ou objeto) ou o próprio item.
    if (Array.isArray(body.output)) {
      for (const item of body.output) {
        if (!isRecord(item) || item.type === "file") continue
        if ("content" in item) {
          yield { value: item.content, source: "body.output[].content" }
        } else {
          yield { value: item, source: "body.output[]" }
        }
      }
    }
  }

  // Hipótese 3: o corpo inteiro já é o `content` (ou uma string JSON dele).
  yield { value: body, source: "body" }
}

/** Localiza e valida o `content` v1 onde quer que esteja no invólucro. */
export function parseMcWrapper(body: unknown): ParseResult {
  const ignoredFiles = countFileParts(body)
  let lastError = "nenhum candidato a `content` no corpo"

  for (const { value, source } of candidates(body)) {
    const obj = asContentObject(value)
    if (obj === undefined) continue

    const parsed = postContentSchema.safeParse(obj)
    if (parsed.success) {
      return { ok: true, content: parsed.data, source, ignoredFiles }
    }
    // Guarda o erro do candidato mais "promissor" para a mensagem final.
    if (isRecord(obj) && "schemaVersion" in obj) {
      lastError = parsed.error.issues
        .map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`)
        .join("; ")
    }
  }

  return {
    ok: false,
    reason: `content v1 não reconhecido no invólucro — ${lastError}`,
    ignoredFiles,
  }
}

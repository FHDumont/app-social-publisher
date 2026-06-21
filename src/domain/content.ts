import { z } from "zod"

/**
 * Estrutura `content` v1 — o modelo de post do app.
 *
 * É o conteúdo que vem DENTRO do campo `content` do push do MC (o invólucro do
 * push é território do MC e não é fixado aqui — ver SETUP/ADR). Esta é a única
 * parte travada nesta fase. O schema Zod é a fonte da verdade: os tipos TS são
 * derivados dele, não duplicados.
 *
 * O `MockReceiver` valida o `content` injetado por este schema, exercitando a
 * mesma fronteira que o receptor real do MC usará depois.
 */

/** Tipo de mídia suportado no descritor. */
export const MEDIA_KINDS = ["image", "video", "document"] as const
export type MediaKind = (typeof MEDIA_KINDS)[number]

/**
 * Descritor de mídia. Na integração real, os bytes chegam pelo invólucro como
 * `file` parts que expiram em ~3 dias — o app deverá baixar e persistir local ao
 * receber. Nesta fase os bytes são placeholders; só o descritor é real.
 */
export const mediaDescriptorSchema = z.object({
  ref: z.string().min(1),
  kind: z.enum(MEDIA_KINDS),
  mime: z.string().min(1),
  name: z.string().min(1),
  alt: z.string().default(""),
})
export type MediaDescriptor = z.infer<typeof mediaDescriptorSchema>

/** Referência a uma mídia (pelo `ref` do descritor) usada em base/override. */
export const mediaRefSchema = z.object({ ref: z.string().min(1) })
export type MediaRef = z.infer<typeof mediaRefSchema>

/** Conteúdo canônico, comum a todos os canais. */
export const postBodySchema = z.object({
  text: z.string().default(""),
  media: z.array(mediaRefSchema).default([]),
})
export type PostBody = z.infer<typeof postBodySchema>

/**
 * Override por canal — só o que difere da base. Ambos os campos opcionais:
 * ausência = herda da base (ex.: texto curto só para X, carrossel só no Instagram).
 */
export const channelOverrideSchema = z.object({
  text: z.string().optional(),
  media: z.array(mediaRefSchema).optional(),
})
export type ChannelOverride = z.infer<typeof channelOverrideSchema>

/** Agendamento: publicar agora, ou em um instante futuro. */
export const scheduleSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("now") }),
  z.object({ mode: z.literal("at"), at: z.iso.datetime() }),
])
export type Schedule = z.infer<typeof scheduleSchema>

/** Origem do post: empurrado pelo MC, ou criado à mão no próprio publisher. */
export const ORIGINS = ["mc", "manual"] as const
export type Origin = (typeof ORIGINS)[number]

/** Estrutura `content` v1 completa. */
export const postContentSchema = z.object({
  schemaVersion: z.literal(1),
  /** UUID usado para dedup/idempotência na recepção. */
  deliveryId: z.uuid(),
  origin: z.enum(ORIGINS),
  createdAt: z.iso.datetime(),
  /** Slugs dos canais onde o post sai. */
  channels: z.array(z.string().min(1)).min(1),
  base: postBodySchema,
  /** Overrides opcionais por canal, chaveados pelo slug do canal. */
  perChannel: z.record(z.string(), channelOverrideSchema).default({}),
  media: z.array(mediaDescriptorSchema).default([]),
  schedule: scheduleSchema,
  /**
   * Ausente ou `false` ⇒ exige revisão humana. Só `true` libera publicação
   * automática (e ainda assim depende de `schedule` válido).
   */
  autoPublish: z.boolean().default(false),
})
export type PostContent = z.infer<typeof postContentSchema>

/**
 * Resolve o conteúdo efetivo de um canal: base + override (override vence campo a
 * campo; ausência herda). É o que o preview por-rede renderiza.
 */
export function resolveChannelBody(
  content: PostContent,
  channelSlug: string
): PostBody {
  const override = content.perChannel[channelSlug]
  return {
    text: override?.text ?? content.base.text,
    media: override?.media ?? content.base.media,
  }
}

/** Resolve os descritores de mídia (não só os refs) do corpo efetivo de um canal. */
export function resolveChannelMedia(
  content: PostContent,
  channelSlug: string
): MediaDescriptor[] {
  const body = resolveChannelBody(content, channelSlug)
  return body.media
    .map((ref) => content.media.find((m) => m.ref === ref.ref))
    .filter((m): m is MediaDescriptor => Boolean(m))
}

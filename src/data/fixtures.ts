import type { Channel } from "@/domain/channels"
import type { MediaDescriptor, PostContent } from "@/domain/content"
import type { Post } from "@/domain/post"

/**
 * Dados falsos da fase F-001. Tudo em memória — nenhuma chamada real ao MC nem às
 * redes. As datas são ancoradas em `APP_NOW_ISO` (constante fixa) para que servidor
 * e cliente rendam o mesmo (sem hydration mismatch em algo que dependa de tempo).
 */

/** "Agora" do app para seed e centragem do calendário (fixo e determinístico). */
export const APP_NOW_ISO = "2026-06-21T12:00:00.000Z"
const ANCHOR = new Date(APP_NOW_ISO).getTime()

/**
 * ISO de um instante com offset de dias em relação ao âncora, com `hour`/`minute`
 * interpretados como horário de São Paulo (UTC-03:00, fixo) — assim o horário
 * autorado é o mesmo que aparece na UI.
 */
function at(daysOffset: number, hour: number, minute = 0): string {
  const d = new Date(ANCHOR)
  d.setUTCDate(d.getUTCDate() + daysOffset)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  const hh = String(hour).padStart(2, "0")
  const mm = String(minute).padStart(2, "0")
  return new Date(`${y}-${m}-${day}T${hh}:${mm}:00-03:00`).toISOString()
}

/** Canais que o `MockPublisher` faz falhar — exercita o caminho de falha. */
export const FAIL_CHANNELS = ["instagram-suporte"]

/* ------------------------------------------------------------------ */
/* Canais (contas "conectadas" — falsas, sem OAuth)                    */
/* ------------------------------------------------------------------ */

export const CHANNELS: Channel[] = [
  {
    slug: "linkedin-empresa",
    networkId: "linkedin",
    accountName: "Acme Tecnologia",
    handle: "company/acme-tec",
    connected: true,
  },
  {
    slug: "linkedin-fundador",
    networkId: "linkedin",
    accountName: "Marina Alvez (Fundadora)",
    handle: "in/marina-alvez",
    connected: true,
  },
  {
    slug: "x-acme",
    networkId: "x",
    accountName: "Acme",
    handle: "@acme",
    connected: true,
  },
  {
    slug: "x-fundador",
    networkId: "x",
    accountName: "Marina Alvez",
    handle: "@marina_alvez",
    connected: false,
  },
  {
    slug: "instagram-acme",
    networkId: "instagram",
    accountName: "acme.oficial",
    handle: "@acme.oficial",
    connected: true,
  },
  {
    slug: "instagram-suporte",
    networkId: "instagram",
    accountName: "acme.suporte",
    handle: "@acme.suporte",
    connected: true,
  },
  {
    slug: "youtube-acme",
    networkId: "youtube",
    accountName: "Acme Vídeos",
    handle: "@acmevideos",
    connected: true,
  },
  {
    slug: "wordpress-blog",
    networkId: "wordpress",
    accountName: "Blog da Acme",
    handle: "blog.acme.com",
    connected: true,
  },
]

/* ------------------------------------------------------------------ */
/* Biblioteca de mídia (descritores — bytes são placeholders)          */
/* ------------------------------------------------------------------ */

const MEDIA: Record<string, MediaDescriptor> = {
  heroProduto: {
    ref: "heroProduto",
    kind: "image",
    mime: "image/jpeg",
    name: "produto-hero.jpg",
    alt: "Tela do produto em um notebook sobre a mesa",
  },
  detalheProduto: {
    ref: "detalheProduto",
    kind: "image",
    mime: "image/jpeg",
    name: "produto-detalhe.jpg",
    alt: "Close do painel de métricas do produto",
  },
  carrossel1: {
    ref: "carrossel1",
    kind: "image",
    mime: "image/jpeg",
    name: "carrossel-1.jpg",
    alt: "Antes: planilhas espalhadas",
  },
  carrossel2: {
    ref: "carrossel2",
    kind: "image",
    mime: "image/jpeg",
    name: "carrossel-2.jpg",
    alt: "Depois: tudo num painel só",
  },
  carrossel3: {
    ref: "carrossel3",
    kind: "image",
    mime: "image/jpeg",
    name: "carrossel-3.jpg",
    alt: "Chamada para teste grátis",
  },
  videoLancamento: {
    ref: "videoLancamento",
    kind: "video",
    mime: "video/mp4",
    name: "lancamento-v2.mp4",
    alt: "Vídeo de lançamento da versão 2",
  },
  whitepaper: {
    ref: "whitepaper",
    kind: "document",
    mime: "application/pdf",
    name: "whitepaper-produtividade.pdf",
    alt: "Whitepaper sobre produtividade em equipes",
  },
}

const ALL_MEDIA = Object.values(MEDIA)

/* ------------------------------------------------------------------ */
/* Conteúdos (estrutura `content` v1)                                  */
/* ------------------------------------------------------------------ */

function content(c: PostContent): PostContent {
  return c
}

const c1: PostContent = content({
  schemaVersion: 1,
  deliveryId: "11111111-1111-4111-8111-111111111111",
  origin: "mc",
  createdAt: at(0, 8, 30),
  channels: ["linkedin-empresa", "x-acme"],
  base: {
    text: "Acabamos de publicar nosso relatório de produtividade 2026: equipes que centralizam a publicação economizam em média 6 horas por semana. O link com o estudo completo está nos comentários. 👇",
    media: [{ ref: "heroProduto" }],
  },
  perChannel: {
    // X tem override: texto curto cabendo nos 280 caracteres.
    "x-acme": {
      text: "Equipes que centralizam a publicação economizam ~6h/semana. Relatório de produtividade 2026 → link nos comentários.",
    },
  },
  media: [MEDIA.heroProduto],
  schedule: { mode: "now" },
  autoPublish: false,
})

const c2: PostContent = content({
  schemaVersion: 1,
  deliveryId: "22222222-2222-4222-8222-222222222222",
  origin: "mc",
  createdAt: at(0, 9, 15),
  channels: ["instagram-acme", "linkedin-empresa"],
  base: {
    text: "Antes e depois de centralizar tudo num painel só. Deslize para ver a diferença. ✨ #produtividade #acme",
    media: [
      { ref: "carrossel1" },
      { ref: "carrossel2" },
      { ref: "carrossel3" },
    ],
  },
  perChannel: {
    "linkedin-empresa": {
      text: "Como nossos clientes reorganizaram o fluxo de publicação — um estudo visual de antes e depois. Detalhes no carrossel.",
    },
  },
  media: [MEDIA.carrossel1, MEDIA.carrossel2, MEDIA.carrossel3],
  schedule: { mode: "at", at: at(3, 14, 0) },
  autoPublish: false,
})

const c3: PostContent = content({
  schemaVersion: 1,
  deliveryId: "33333333-3333-4333-8333-333333333333",
  origin: "mc",
  createdAt: at(-1, 10, 0),
  channels: ["linkedin-empresa", "wordpress-blog"],
  base: {
    text: "Novo artigo no blog: o guia completo de calendário editorial para times enxutos. Da ideia à publicação em 5 passos, com modelos prontos.",
    media: [{ ref: "whitepaper" }],
  },
  perChannel: {},
  media: [MEDIA.whitepaper],
  schedule: { mode: "at", at: at(1, 11, 30) },
  autoPublish: true,
})

const c4: PostContent = content({
  schemaVersion: 1,
  deliveryId: "44444444-4444-4444-8444-444444444444",
  origin: "mc",
  createdAt: at(-2, 7, 45),
  channels: ["x-acme", "linkedin-fundador"],
  base: {
    text: "A versão 2 chegou. Mais rápida, mais clara, e agora com calendário visual. Obrigado a quem testou no beta. 🚀",
    media: [{ ref: "videoLancamento" }],
  },
  perChannel: {},
  media: [MEDIA.videoLancamento],
  schedule: { mode: "now" },
  autoPublish: true,
})

const c5: PostContent = content({
  schemaVersion: 1,
  deliveryId: "55555555-5555-4555-8555-555555555555",
  origin: "mc",
  createdAt: at(-1, 16, 20),
  channels: ["instagram-acme", "instagram-suporte"],
  base: {
    text: "Plantão de dúvidas hoje às 17h no nosso perfil. Traga suas perguntas sobre o novo painel! 💬",
    media: [{ ref: "detalheProduto" }],
  },
  perChannel: {},
  media: [MEDIA.detalheProduto],
  schedule: { mode: "now" },
  autoPublish: true,
})

const c6: PostContent = content({
  schemaVersion: 1,
  deliveryId: "66666666-6666-4666-8666-666666666666",
  origin: "manual",
  createdAt: at(0, 11, 0),
  channels: ["x-acme", "instagram-acme"],
  base: {
    text: "Bastidores da equipe esta semana: como a gente decide o que publicar. Fica a dica para quem está montando o próprio calendário. 🗓️",
    media: [{ ref: "heroProduto" }],
  },
  perChannel: {},
  media: [MEDIA.heroProduto],
  schedule: { mode: "at", at: at(2, 9, 0) },
  autoPublish: false,
})

const c7: PostContent = content({
  schemaVersion: 1,
  deliveryId: "77777777-7777-4777-8777-777777777777",
  origin: "manual",
  createdAt: at(-3, 13, 0),
  channels: ["wordpress-blog"],
  base: {
    text: "Retrospectiva do trimestre: o que aprendemos publicando 3x mais sem aumentar a equipe.",
    media: [{ ref: "detalheProduto" }],
  },
  perChannel: {},
  media: [MEDIA.detalheProduto],
  schedule: { mode: "now" },
  autoPublish: false,
})

const c8: PostContent = content({
  schemaVersion: 1,
  deliveryId: "88888888-8888-4888-8888-888888888888",
  origin: "mc",
  createdAt: at(0, 7, 10),
  channels: ["linkedin-empresa"],
  base: {
    text: "Vaga aberta: pessoa designer de produto para o time de growth. Remoto, Brasil. Compartilhe com quem se encaixa!",
    media: [],
  },
  perChannel: {},
  media: [],
  schedule: { mode: "now" },
  autoPublish: false,
})

/* ------------------------------------------------------------------ */
/* Posts seed (content + estado local + resultados)                    */
/* ------------------------------------------------------------------ */

export const SEED_POSTS: Post[] = [
  // 1) MC · now · revisão humana → aguardando na inbox.
  {
    content: c1,
    state: "aRevisar",
    channelResults: [],
    receivedAt: at(0, 8, 31),
    rejected: false,
  },
  // 2) MC · at futuro · revisão humana → na inbox (vira agendado ao aprovar).
  {
    content: c2,
    state: "aRevisar",
    channelResults: [],
    receivedAt: at(0, 9, 16),
    rejected: false,
  },
  // 3) MC · at futuro · autoPublish → pulou revisão, agendado (calendário).
  {
    content: c3,
    state: "agendado",
    channelResults: c3.channels.map((ch) => ({
      channel: ch,
      status: "pendente",
    })),
    receivedAt: at(-1, 10, 1),
    rejected: false,
  },
  // 4) MC · now · autoPublish → já publicado em todos os canais (passado).
  {
    content: c4,
    state: "publicado",
    channelResults: [
      {
        channel: "x-acme",
        status: "publicado",
        publishedUrl: "https://exemplo.local/x-acme/post/44444444",
      },
      {
        channel: "linkedin-fundador",
        status: "publicado",
        publishedUrl: "https://exemplo.local/linkedin-fundador/post/44444444",
      },
    ],
    receivedAt: at(-2, 7, 46),
    rejected: false,
  },
  // 5) MC · now · autoPublish → FALHOU em um canal (caminho de falha visível).
  {
    content: c5,
    state: "falhou",
    channelResults: [
      {
        channel: "instagram-acme",
        status: "publicado",
        publishedUrl: "https://exemplo.local/instagram-acme/post/55555555",
      },
      {
        channel: "instagram-suporte",
        status: "falhou",
        error: "Conta sem permissão de publicação (token expirado). [mock]",
      },
    ],
    receivedAt: at(-1, 16, 21),
    rejected: false,
  },
  // 6) Manual · at futuro · aprovado → agendado (calendário).
  {
    content: c6,
    state: "agendado",
    channelResults: c6.channels.map((ch) => ({
      channel: ch,
      status: "pendente",
    })),
    receivedAt: at(0, 11, 1),
    rejected: false,
  },
  // 7) Manual · publicado no passado.
  {
    content: c7,
    state: "publicado",
    channelResults: [
      {
        channel: "wordpress-blog",
        status: "publicado",
        publishedUrl: "https://exemplo.local/wordpress-blog/post/77777777",
      },
    ],
    receivedAt: at(-3, 13, 1),
    rejected: false,
  },
  // 8) MC · now · revisão humana → recusado (visível no filtro Recusados).
  {
    content: c8,
    state: "aRevisar",
    channelResults: [],
    receivedAt: at(0, 7, 11),
    rejected: true,
  },
]

/**
 * Pool que o `MockReceiver` injeta ao "simular recebimento do MC". São templates
 * `origin:"mc"`; o receptor gera id/createdAt frescos a cada simulação.
 */
export const MC_PUSH_POOL: PostContent[] = [
  content({
    schemaVersion: 1,
    deliveryId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    origin: "mc",
    createdAt: APP_NOW_ISO,
    channels: ["linkedin-empresa", "x-acme", "instagram-acme"],
    base: {
      text: "Webinar gratuito na próxima quinta: 'Calendário editorial que se mantém sozinho'. Vagas limitadas — inscreva-se pelo link.",
      media: [{ ref: "heroProduto" }],
    },
    perChannel: {
      "x-acme": {
        text: "Webinar grátis quinta: 'Calendário editorial que se mantém sozinho'. Vagas limitadas → link.",
      },
    },
    media: [MEDIA.heroProduto],
    schedule: { mode: "now" },
    autoPublish: false,
  }),
  content({
    schemaVersion: 1,
    deliveryId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    origin: "mc",
    createdAt: APP_NOW_ISO,
    channels: ["instagram-acme"],
    base: {
      text: "Dica rápida da semana: agende seus posts no domingo e respire o resto da semana. 🧘 #produtividade",
      media: [{ ref: "carrossel1" }, { ref: "carrossel2" }],
    },
    perChannel: {},
    media: [MEDIA.carrossel1, MEDIA.carrossel2],
    schedule: { mode: "at", at: at(4, 10, 0) },
    autoPublish: false,
  }),
]

/** Toda a mídia conhecida (para a UI resolver descritores por ref, se preciso). */
export const MEDIA_LIBRARY = ALL_MEDIA

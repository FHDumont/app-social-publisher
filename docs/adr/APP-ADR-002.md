# APP-ADR-002 — Recepção real do MC: inbox em memória no servidor + ponte por polling

- **Status:** accepted
- **Data:** 2026-06-21
- **Fase:** F-int-mc

## Contexto

F-001 entregou a inbox **100% no cliente**: o estado vive em React Context no browser e o
`MockReceiver` roda no browser. F-int-mc precisa expor o **receptor real** do push do MC
(`POST /mc/callback`) — que é **server-side** e não compartilha memória com nenhuma aba. O
critério de pronto exige que o post recebido **apareça na inbox igual aos mockados**. Logo,
há um vão a transpor entre onde o push chega (servidor) e onde a inbox é exibida (cliente).

Forças em jogo:

- Persistência real (BD) **ainda não está definida** (pendência para o chat) — esta fase não
  pode depender dela.
- O formato do invólucro do push é hipótese até o teste de ponta a ponta (§6.B); o receptor
  precisa subir já, defensivo.
- A publicação real é fase futura; o `MockPublisher` é client-side.

## Decisão

**Inbox em memória no servidor** (singleton de processo em `src/io/mc-inbox.server.ts`,
ancorado em `globalThis` para sobreviver ao HMR do `next dev`). O `POST /mc/callback` valida o
token (env `MC_APP_TOKEN`), loga o corpo cru, responde `202` rápido e processa **assíncrono**
(`queueMicrotask`): parser defensivo do `content` v1, dedup por `deliveryId`, injeção via
`decideOnReceive` (a mesma máquina de estados de F-001, **não** alterada).

**Ponte server→client por polling.** O cliente busca `GET /mc/inbox` (a) **a cada ~4s** e
(b) por um **botão "Atualizar"** na inbox, e mescla os posts de forma **idempotente por
`deliveryId`** (não sobrescreve posts já editados/aprovados localmente). O contrato de fio é
um schema Zod único (`src/io/mc-inbox-wire.ts`) usado pelos dois lados.

O `MockReceiver` de F-001 **permanece** (dev offline), convivendo com o receptor real.

## Alternativas consideradas

- **Fetch só no mount + botão Atualizar (sem polling)** — mais KISS, mas no teste ao vivo o
  testador teria que clicar para ver o push chegar. O dono pediu polling **e** botão.
- **SSE/WebSocket push para o cliente** — entrega instantânea, mas é infra a mais para uma
  fase cujo alvo é só estar no ar para o teste; over-engineering (YAGNI).
- **Persistir direto em BD e o cliente ler do BD** — o BD ainda não foi definido (D-006);
  acoplaria esta fase a uma decisão em aberto.
- **Mover a inbox toda para o servidor** — redesenho grande de F-001 sem necessidade nesta
  fase; o cliente segue dono do estado de UI, o servidor só guarda o que recebeu do MC.

## Consequências

Habilita subir o receptor real **já**, defensivo, sem esperar BD nem o formato final do
invólucro, com o post recebido visível na inbox ao lado dos mockados.

Custos / trade-offs aceitos:

- **Estado só em memória no servidor**: posts recebidos **somem no restart** do processo
  (D-005), até `F-persistência` definir o BD (D-006). Esperado nesta fase.
- **Latência de até ~4s** entre o push e o post aparecer (polling), mitigada pelo botão
  "Atualizar". Aceitável para o alvo (teste de ponta a ponta).
- **Sem orquestração de publicação no servidor** (o `MockPublisher` é client-side): um push
  `autoPublish:true` cai em `aRevisar` em vez de publicar ao receber (D-007). Fora do escopo
  do teste atual (`autoPublish:false`).
- Introduz código **server-only** (`*.server.ts` + route handlers em `src/app/mc/`); deve ser
  importado apenas por route handlers.

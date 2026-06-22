# SETUP — histórico

> Specs de fases **concluídas**, na íntegra, cada uma com um bloco **"Notas de implementação"** anexado (desvios da spec, soluções não-óbvias, becos evitados — o que vale reler depois; não é log passo-a-passo). Append quando uma fase fecha.
>
> Imutável. Veja `examples/docs/history/SETUP-HISTORICO.md` pra um exemplo preenchido.

---

# F-001 — Scaffold + layout mock fim-a-fim

## Objetivo

Nascer o app (Next 15 + React 19 + Tailwind + shadcn) e entregar a **jornada inteira do publisher navegável com dados falsos**, sobre um modelo de post real e uma máquina de estados real. Alvo: **aprovar layout e UX** antes de qualquer integração real. Nenhuma chamada real ao MC nem às redes.

## Contexto assumido

O publisher é **receptor puro (Modo B)** do MC: nunca submete job, nunca faz polling — o MC empurra posts prontos por push agendado. O **invólucro** do push é território do MC (3 pontos abertos na §6.B do manual de integração: formato do corpo, id consultável, headers) e **não foi fixado** aqui — nesta fase é mockado. O que é deste app é o conteúdo dentro do campo `content`, cuja estrutura está travada (v1) e é o modelo de post do app.

### Estrutura `content` v1

`schemaVersion` (1), `deliveryId` (uuid, dedup/idempotência), `origin` (`mc`|`manual`), `createdAt` (ISO-8601), `channels` (slugs de canal), `base` (`{ text, media: [refs] }`), `perChannel` (overrides opcionais por canal), `media` (descritores `{ ref, kind, mime, name, alt }`; bytes chegam pelo invólucro como `file` parts que expiram em ~3 dias — fora de escopo nesta fase), `schedule` (`{ mode: "now" }` ou `{ mode: "at", at }`), `autoPublish` (ausente/`false` ⇒ exige revisão; só `true` libera automático).

## Escopo

**Entrou:** scaffold (Next 15 + React 19 + TS estrito + Tailwind v4 + shadcn), `CONVENCOES.md` preenchido, APP-ADR-001, modelo de post (`content` v1 + estado local `aRevisar|agendado|publicado|falhou` + resultado por canal), máquina de estados real, registro de redes (LinkedIn, X, Instagram, YouTube, WordPress/Newsletter) com descritor de capacidade, fronteiras mock atrás de interface (`MockReceiver`/`MockPublisher`), telas (inbox/fila de revisão, composer+preview por-rede, calendário semana/dia/mês, channels, composer manual) e o caminho publicar→estado visível incluindo falha. Design moderno em PT-BR.

**NÃO entrou:** integração real com o MC, OAuth/publicação real, persistência real, download/persistência de mídia, analytics/biblioteca de mídia/tags/repetição. (Registrados em `ROADMAP.md`.)

## Critério de pronto — verificado

- App scaffoldado; `npm run dev` sobe sem erro (porta 3000/3001). `tsc`, `eslint` e `next build` passam limpos.
- Jornada navegável ponta a ponta só com dados falsos: receber (mock) → revisar/aprovar → compor/editar com preview por-rede → agendar/publicar (mock) → ver estado, com caminho de falha visível (post `falhou` com motivo por canal + "Tentar novamente").
- Máquina de estados exercitada pelos fixtures (todos em `aRevisar` por padrão; `autoPublish:true`+schedule válido pula revisão; `at` futuro aparece no calendário; um post em `falhou`).
- Todas as redes com descritor aplicado no preview/validação.
- `MockReceiver`/`MockPublisher` isolados atrás de interface.

## Notas de implementação

- **Next 15, não 16.** `create-next-app@latest` instala Next 16; a spec pediu 15 explicitamente, então fixei **15.5.19** (regenerei o scaffold) para honrar o literal e não surpreender. Migrar a 16 = novo ADR.
- **shadcn `base-nova` + Base UI.** A versão atual do shadcn usa Base UI (não Radix) e distribui a camada de estilo via `@import "shadcn/tailwind.css"`. Por isso `shadcn` ficou como **dependência de runtime** (removê-la quebra o build do CSS). Cheguei a removê-la e o build falhou — reinstalada.
- **Ícones de marca.** lucide v1 removeu ícones de marca (trademark); criei **SVGs inline** dos glifos de LinkedIn/X/Instagram/YouTube e usei `Rss` para WordPress (`src/components/networks/network-glyph.tsx`).
- **Zod adotado** para o `content` v1: o `MockReceiver` valida o payload pelo schema, exercitando a mesma fronteira que o receptor real usará. Tipos derivados do schema.
- **Sem libs de estado/máquina.** Estado em React Context + `useReducer`; máquina de estados como funções puras (`src/domain/state-machine.ts`). YAGNI sobre Zustand/XState.
- **Timezone fixo (America/Sao_Paulo).** Tudo que renderiza tempo no servidor e no cliente usa TZ fixo e um relógio de app fixo (`APP_NOW_ISO`) para evitar hydration mismatch; o calendário/scheduling convertem `datetime-local` com offset `-03:00` (Brasil sem DST desde 2019).
- **"Recusar".** O enum de estado tem 4 valores; recusa não é um estado da máquina — é uma flag `rejected` que tira o post da fila ativa mas o mantém visível no filtro "Recusados" (reversível por "Restaurar"). Nada some em silêncio.
- **Estado em memória.** Recarregar zera tudo — esperado nesta fase de dados falsos.

---

# F-int-mc — Receptor do push do MC (mc→app) no ar

## Objetivo

Expor o endpoint real que recebe o push agendado do MC (Modo B / receptor puro), valida o token, parseia o `content` v1 e injeta o post na inbox como `origin:"mc"`. Meta imediata: **estar no ar para o teste de ponta a ponta** (um agent de exemplo no MC empurra posts de texto). Sem mídia, sem publicação real, sem persistência real. O `MockReceiver` de F-001 **permanece** (dev offline), ao lado do receptor real.

## Contexto / contrato

O MC chama `POST <callback>` com `Authorization: Bearer <token-por-app>` (`mcat_…`; aqui só mc→app). O corpo é um invólucro do MC que **contém** o campo aberto `content` (v1). O **formato exato do invólucro** (§6.B 1–3) **não estava cravado** — receptor **defensivo**: loga o corpo cru e valida o `content` onde quer que ele esteja, falhando **visível** se não reconhecer. O teste com o agent de exemplo confirma o formato.

### `content` v1 (reusado de `src/domain/content.ts`)

`schemaVersion` (1), `deliveryId` (uuid, dedup), `origin` (`"mc"`), `createdAt` (ISO-8601), `channels`, `base` (`{text, media:[refs]}`), `perChannel`, `media` (vazio no teste), `schedule` (`now`|`at`), `autoPublish` (false ⇒ revisão humana).

## Escopo

**Entrou:** `POST /mc/callback` (Bearer via `MC_APP_TOKEN`; `401` ausente/errado, `503` sem env; `202` rápido + processamento assíncrono; log do corpo cru); parser defensivo do `content` v1 (`src/io/mc-wrapper.ts`, localiza em `body.content` / `body.output[].post` / corpo); dedup por `deliveryId`; injeção via `decideOnReceive` (máquina de estados de F-001 **não** alterada); tolerância a `file` parts (ignoradas+registradas); inbox em memória no servidor (`src/io/mc-inbox.server.ts`); ponte server→client por `GET /mc/inbox` + polling ~4s + botão "Atualizar" (APP-ADR-002); `MC_APP_TOKEN` por env (`.env.example`); docs de exposição para o dono no README.

**NÃO entrou:** download/persistência de mídia (F-mídia); publicação real (F-oauth-redes); polling/Modo A/submissão de jobs; fixar o formato definitivo do invólucro (defensivo até o teste — D-002); persistência real / definição de BD (D-005, D-006).

## Critério de pronto — verificado

- `POST /mc/callback` no ar; `401` sem/with token errado, `503` sem env, `202` rápido (smoke via curl).
- Corpo cru logado; `content` v1 validado; conteúdo não reconhecido vira **erro visível** consultável em `GET /mc/inbox` (verificado: payload com `channels:[]` → erro com motivo Zod).
- `deliveryId` deduplica (mesmo push 2x → 1 post).
- Post recebido aparece na inbox como `origin:"mc"` / `aRevisar`, ao lado dos mockados (verificado no browser: card "Olá do MC real (teste e2e)" + botão "Atualizar"; sem erros de console).
- Token de env (não hardcoded); `.env.local`/exposição documentados no README.
- `tsc`, `eslint`, `prettier`, `next build` limpos.

## Notas de implementação

- **A restrição central era arquitetural, não a do invólucro.** A inbox de F-001 é client-side; o callback é server-side. Resolvido com inbox em memória no servidor (singleton em `globalThis`, sobrevive ao HMR) + ponte por polling — decidido com o dono e registrado em **APP-ADR-002** (o dono pediu polling **e** botão "Atualizar").
- **Parser defensivo por geração de candidatos** (`mc-wrapper.ts`): tenta `body.content`, itens `body.output` com `type:"post"` (no `.content` do item ou o próprio item), e o corpo inteiro; o 1º que casa no `postContentSchema` vence. Guarda o erro Zod do candidato com `schemaVersion` para a mensagem final — erro útil, nunca silencioso.
- **`202` + `queueMicrotask`** para honrar "responde rápido, processa assíncrono"; a validação do token é síncrona (gate de `401`) antes de aceitar. Em processo Node persistente (lab) o microtask completa; em serverless, trabalho pós-resposta pode ser cortado — reavaliar se o deploy mudar.
- **Contrato de fio único** (`mc-inbox-wire.ts`, Zod) compartilhado por `GET /mc/inbox` e pelo cliente — I/O validado nos dois lados, como manda CONVENCOES. `WirePost` é estruturalmente um `Post`.
- **Merge idempotente por `deliveryId`** no reducer (`MERGE_REMOTE`): só adiciona o que ainda não existe, para o polling não duplicar nem sobrescrever posts já aprovados/editados localmente.
- **`file` parts** só são contadas/logadas (mídia é F-mídia). **Auto-publish na recepção real** não é orquestrado no servidor (publisher é client-side) → posts `autoPublish` caem em `aRevisar` (D-007); fora do escopo do teste (`autoPublish:false`).
- **Verificação no browser** exigiu um servidor com o token; usei uma config `lab` temporária no `launch.json` (revertida depois) — o `GET /mc/inbox` não exige token, mas o `POST` sim. `.env`/segredos não foram tocados (responsabilidade do dono).
- **Formato do invólucro confirmado no teste real (D-002 fechado).** O MC envia `{ jobId, status, output: [ { type:"text", content:"<JSON v1 como string>" } ] }` — o `content` v1 chega como **string JSON** dentro de um item `output` com `type:"text"` (minhas hipóteses iniciais eram `type:"post"` e `content` como objeto). Ajustei o `mc-wrapper.ts`: varre `output` ignorando só `type:"file"`, e faz `JSON.parse` quando o `content` é string. Confirmado pela cadeia real (`https://social.lab/...` → `202`, `source=body.output[].content`). Foi exatamente o cenário "defensivo até o teste revelar" previsto na spec.
- **Exposição (infra do dono).** O roteamento `social.lab` vivia no Traefik do home-lab (`infra/traefik/config/dynamic/middlewares.yml`): os routers de `social.lab` apontavam pro service `mc` (3000) por copy-paste; o dono corrigiu para o service `social-publisher` (`host.docker.internal:3010`). Não toquei nessa config (território do dono) — só diagnostiquei.

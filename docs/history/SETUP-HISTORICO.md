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

# Social Publisher

Satélite do **Mission Control (MC)** para publicação em redes sociais. É um
**receptor puro (Modo B)**: o MC empurra posts prontos por push agendado; este app
recebe, deixa revisar/agendar e publica nas redes — nunca submete job nem faz polling.

> **Status:** F-int-mc — receptor real do push do MC no ar (`POST /mc/callback`), ao lado
> da jornada mock de F-001. Ainda **sem** mídia, publicação real nas redes nem persistência
> (inbox em memória). Veja `docs/CHANGELOG.md` e `docs/ROADMAP.md`.

## O que dá pra fazer hoje (dados falsos)

- **Inbox** — fila de revisão dos posts que o MC "empurrou"; aprovar, recusar, filtrar (a revisar / falhas / recusados).
- **Composer + preview por-rede** — editar o texto base e versões por canal; ver como o post sai em cada rede, respeitando o limite/capacidade de cada uma.
- **Calendário** — visão mês/semana/dia dos posts agendados e publicados.
- **Canais** — contas "conectadas" por rede (sem OAuth real).
- **Configurações** — placeholder visual da área de admin (token/callback do MC, OAuth) — contratos reais ficam para fases futuras.
- **Simular recebimento do MC** e o caminho **publicar → estado** (incluindo falha visível) são mockados de ponta a ponta.

## Stack

- **Next 15** (App Router) + **React 19** + **TypeScript** estrito
- **Tailwind v4** + **shadcn/ui** (estilo `base-nova`, sobre Base UI)
- **Zod** (schema do modelo de post `content` v1) · **next-themes** (claro/escuro)
- Estado em memória (React Context + reducer) — sem banco nesta fase

## Rodando local (lab)

```bash
npm install
npm run lab:start     # ou: scripts/start.sh    → http://localhost:3010
npm run lab:stop      # ou: scripts/stop.sh
```

Alternativa direta: `npm run dev` (porta 3000). Outros comandos: `npm run build`,
`npm run lint`, `npm run typecheck`, `npm run format`.

## Estrutura

```
src/
├─ domain/        modelo e regras puras (sem React, sem I/O)
│  ├─ content.ts      estrutura `content` v1 (schema Zod = fonte da verdade)
│  ├─ post.ts         estado local do post + resultado por canal
│  ├─ state-machine.ts  máquina de estados real (aRevisar→agendado/publicado/falhou)
│  ├─ networks.ts     registro de redes + descritor de capacidade + validação
│  └─ channels.ts     tipo de canal (conta conectada)
├─ io/            fronteiras atrás de interface + mocks (MockReceiver, MockPublisher)
├─ store/         estado da app (context/reducer) ligando domínio e I/O
├─ data/          fixtures (dados falsos)
├─ lib/           apoio (formatação, calendário, canais)
├─ components/    ui/ (shadcn) + áreas próprias (posts, networks, composer, shell)
└─ app/           rotas (Inbox, calendário, canais, config, composer)
```

## Método de trabalho

Este projeto segue o método de **docs vivos** + separação chat (raciocínio) /
agente (execução). A instrução canônica do agente é **`AGENTS.md`** — leia primeiro.
Convenções de código/UI deste projeto: **`CONVENCOES.md`**. Decisões: `docs/DECISOES.md`
(+ `docs/adr/`). Namespace de ADR deste repo: `APP-ADR-NNN`.

## Integração real com o MC (F-int-mc — no ar)

O receptor real do push (mc→app, Modo B) já está implementado, **defensivo** (o formato
exato do invólucro do MC é confirmado pelo teste de ponta a ponta — §6.B / D-002). Decisão
de arquitetura em `docs/adr/APP-ADR-002.md`.

**Endpoints:**

- `POST /mc/callback` — recebe o push do MC. Exige `Authorization: Bearer <MC_APP_TOKEN>`;
  responde `202` rápido e processa assíncrono. `401` se o token faltar/divergir; `503` se a
  env não estiver configurada. Loga o corpo cru, valida o `content` v1, deduplica por
  `deliveryId` e injeta o post na inbox como `origin:"mc"`.
- `GET /mc/inbox` — ponte server→client: lista os posts recebidos e as entregas inválidas
  (erro visível e consultável). O front faz polling (~4s) e tem um botão **"Atualizar"**.

> **Limitação desta fase:** a inbox recebida vive **em memória no servidor** — some no
> restart. Persistência real (BD) ainda **não está definida** (D-006). Sem mídia (F-mídia)
> nem publicação real (F-oauth-redes).

### O que o dono precisa fazer

1. **Token.** Copie `.env.example` → `.env.local` e preencha `MC_APP_TOKEN` com o `mcat_…`
   emitido para este app no MC. (`.env.local` é ignorado pelo git; o agente não o toca.)

   ```bash
   cp .env.example .env.local
   # edite .env.local e defina MC_APP_TOKEN=mcat_...
   ```

2. **Exposição.** Para o MC alcançar o callback, exponha o serviço em `social.lab`
   (DNS `social.lab` → container/host onde o app roda; porta publicada). O callback a
   cadastrar no MC é:

   ```
   https://social.lab/mc/callback
   ```

3. **Smoke test (opcional).** Com o app no ar e `MC_APP_TOKEN` definido:

   ```bash
   curl -i -X POST http://localhost:3010/mc/callback \
     -H "Authorization: Bearer $MC_APP_TOKEN" -H "Content-Type: application/json" \
     -d '{"content":{"schemaVersion":1,"deliveryId":"00000000-0000-4000-8000-000000000000","origin":"mc","createdAt":"2026-06-21T15:00:00.000Z","channels":["linkedin-empresa"],"base":{"text":"ping"},"schedule":{"mode":"now"},"autoPublish":false}}'
   # → 202; o post aparece na Inbox (polling ou botão "Atualizar").
   ```

Só o conteúdo do campo `content` (o modelo de post v1) é deste app e já está travado.
Ver `docs/DEBITO-TECNICO.md`, `docs/DECISOES.md` e `docs/ROADMAP.md`.

# Social Publisher

Satélite do **Mission Control (MC)** para publicação em redes sociais. É um
**receptor puro (Modo B)**: o MC empurra posts prontos por push agendado; este app
recebe, deixa revisar/agendar e publica nas redes — nunca submete job nem faz polling.

> **Status:** F-001 — scaffold + layout mock fim-a-fim. A jornada inteira é navegável
> **só com dados falsos**; não há integração real com o MC nem com as redes ainda.
> O alvo desta fase é aprovar layout e UX. Veja `docs/CHANGELOG.md` e `docs/ROADMAP.md`.

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

## Integração com o MC (fase futura)

A recepção real do push depende de 3 pontos ainda em aberto no manual de integração
(§6.B), **território do MC**: formato do corpo, id consultável e headers do invólucro.
Só o conteúdo do campo `content` (o modelo de post v1) é deste app e já está travado.
Ver `docs/DEBITO-TECNICO.md` e `docs/ROADMAP.md`.

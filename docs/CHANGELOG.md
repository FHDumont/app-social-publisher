# CHANGELOG

> Ledger append-only. **1 linha por fase entregue:** `F-xxx — o que entrou — AAAA-MM-DD`.
> O detalhe cheio da fase vive em `docs/history/SETUP-HISTORICO.md` (o ponteiro é o ID).
> Veja `examples/docs/CHANGELOG.md` pra um exemplo preenchido.

- **F-001** — scaffold (Next 15 + React 19 + Tailwind + shadcn) e jornada inteira do publisher navegável com dados falsos: modelo `content` v1, máquina de estados real, registro de redes, fronteiras mock (Receiver/Publisher) e telas (inbox, composer+preview por-rede, calendário, canais, composer manual) — 2026-06-21
- **F-int-mc** — receptor real do push do MC no ar: `POST /mc/callback` (Bearer via `MC_APP_TOKEN`, `202` rápido + processamento assíncrono, log do corpo cru), parser defensivo do `content` v1, dedup por `deliveryId`, tolerância a `file` parts; inbox em memória no servidor + ponte por polling/`GET /mc/inbox` para a inbox de F-001 (APP-ADR-002). Sem mídia/publicação/persistência reais — 2026-06-21


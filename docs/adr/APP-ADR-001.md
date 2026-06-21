# APP-ADR-001 — Stack do satélite, linguagem visual e estrutura de pastas

- **Status:** accepted
- **Data:** 2026-06-21
- **Fase:** F-001

## Contexto

O `app-social-publisher` é um satélite do Mission Control (MC), sendo refeito do zero.
A fase F-001 nasce o app e entrega a jornada inteira do publisher navegável **só com dados
falsos**, com o alvo de **aprovar layout e UX** antes de qualquer integração real. Decisões
de base precisavam ser fixadas: stack, linguagem visual e como organizar o código de modo
que a troca mock→real (MC e redes sociais) seja swap de implementação, não redesenho.

Forças em jogo:

- O publisher é **receptor puro (Modo B)**: recebe `content` pronto por push do MC; o
  invólucro do push é território do MC e **não** deve ser fixado aqui.
- Prioridade explícita do dono: visual moderno e usabilidade excelente, evitando a aparência
  "shadcn default templated".
- "Máquina de estados real mesmo com I/O falso" — o domínio precisa ser real e testável,
  isolado de React e de I/O.

## Decisão

**Stack.** Next 15 (App Router) + React 19 + TypeScript estrito + Tailwind v4 + shadcn/ui
(estilo `base-nova`, sobre Base UI). Zod para o schema do `content` v1. `next-themes` para
tema claro/escuro. Sem biblioteca de estado externa nem de máquina de estados: o estado vive
em React Context + `useReducer`, e a máquina de estados é um módulo de funções puras.

**Linguagem visual "cabine de publicação".** Canvas claro e quente + **trilho lateral escuro**
(assinatura que foge do cinza neutro padrão do shadcn). Primária índigo elétrico. Cada estado
da máquina (`aRevisar`, `agendado`, `publicado`, `falhou`, além de `recusado`) tem **cor
semântica própria** via tokens `--status-*` em oklch. Tipografia: Geist (UI) + Sora (títulos).
Toda a interface em **PT-BR**.

**Estrutura de pastas por camada.** `domain/` (modelo e regras puras), `io/` (fronteiras atrás
de interface + mocks), `store/` (context/reducer ligando domínio e I/O), `data/` (fixtures),
`lib/` (apoio), `components/{ui,área}/`, `app/` (rotas). As duas fronteiras de I/O — `Receiver`
e `Publisher` — são **interface + implementação mock**, para que a troca mock→real seja apenas
uma nova implementação.

## Alternativas consideradas

- **Next 16** (o `create-next-app@latest` instala 16) — a spec pediu Next 15 explicitamente;
  honramos o literal (15.5.19) para não surpreender. Migrar a 16 vira um novo ADR se desejado.
- **Zustand / Redux** para estado — desnecessário para um app de uma fase com dados em memória;
  Context + reducer resolve sem dependência extra (YAGNI).
- **XState** para a máquina de estados — poder além do necessário; a máquina aqui é pequena e
  fica mais legível como funções puras testáveis.
- **shadcn default (base neutra)** — exatamente a aparência que o dono pediu para evitar.
- **Persistência (Postgres/Drizzle)** — fora de escopo nesta fase (dados falsos); fica para fase futura.

## Consequências

Habilita aprovar o layout/UX cedo, com domínio e máquina de estados reais já no lugar e as
fronteiras de I/O prontas para receber as implementações reais (receptor do push do MC; OAuth
+ APIs das redes) sem redesenho.

Custos / trade-offs aceitos:

- O pacote `shadcn` vira **dependência de runtime** (não só CLI), porque `globals.css` importa
  `shadcn/tailwind.css` — a camada de utilitários do estilo `base-nova`.
- A lucide v1 removeu ícones de marca; os glifos das redes são **SVGs inline** próprios.
- Estado só em memória: recarregar zera tudo (esperado nesta fase de dados falsos).
- Datas precisam de timezone fixo (America/Sao_Paulo) para evitar hydration mismatch — uma
  restrição a lembrar ao lidar com tempo na UI.

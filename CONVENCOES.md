# CONVENÇÕES

> Padrões de código e UI **deste** projeto. Específico de stack — segue o que foi de fato adotado em F-001.
> O agente (`AGENTS.md`) segue o que estiver aqui. Estável: não muda por fase.
>
> Mantenha enxuto: convenção que não vai ser feita cumprir é ruído.

## Linguagem / tipos

- TypeScript **strict** sempre (`tsconfig` herdado do Next). Sem `any` exceto justificado com comentário.
- Validação de I/O com **Zod**; tipos derivados do schema, não duplicados (`z.infer`). Ver `src/domain/content.ts`.
- Sem `enum` do TS — preferir const objects + `as const` (ex.: `POST_STATES`, `NETWORK_IDS`).
- Imports absolutos via alias `@/*` (configurado no `tsconfig`).

## Estilo

- Formatter: **Prettier** (`.prettierrc.json`) + `prettier-plugin-tailwindcss` (ordena classes).
  Sem ponto-e-vírgula, aspas duplas, `trailingComma: es5`. Rode `npm run format`.
- Linter: **ESLint flat config** do Next (`next/core-web-vitals` + `next/typescript`).
- 2 espaços.

## Estrutura de arquivos

- `src/domain/` — modelo e regras puras (sem React, sem I/O): tipos, schema, máquina de estados, registro de redes.
- `src/io/` — fronteiras de I/O atrás de interface (`Receiver`, `Publisher`) + implementações mock.
- `src/store/` — estado da aplicação (React context + reducer) ligando domínio e I/O.
- `src/data/` — fixtures (dados falsos da fase).
- `src/lib/` — utilitários de apoio (formatação, calendário, resolução de canais).
- `src/components/ui/` — componentes shadcn instalados (**não editar** — wrappers ao lado).
- `src/components/<área>/` — componentes próprios por área (posts, networks, composer, shell).
- `src/app/` — rotas (App Router).
- Um arquivo, uma responsabilidade. ~300 linhas como referência de teto (não dogma).

## Naming

- `camelCase` para variáveis/funções; `PascalCase` para tipos e componentes.
- `SCREAMING_SNAKE_CASE` para constantes globais (`APP_NOW_ISO`, `NETWORKS`).
- `kebab-case` para nome de arquivo (inclusive componentes — ex.: `network-preview.tsx`).
- Slugs de canal: `kebab-case` (`linkedin-empresa`).

## Erros

- Não engolir erro em silêncio. **Falha de publicação é sempre visível** (estado `falhou` + motivo por canal).
- I/O inválido na fronteira (push do MC) é reportado via callback `onInvalid`, nunca descartado.
- Esperado → modelado no tipo (status discriminado em `ChannelResult`). Inesperado → propaga.

## Comentários

- Comente o **porquê**, não o **o quê**. Documente decisões não-óbvias (ex.: timezone fixo p/ evitar hydration mismatch).
- Sem código morto comentado — o histórico fica no git.

## Testes

- Nesta fase (F-001) não há testes automatizados (registrado em `DEBITO-TECNICO.md`).
- Quando entrarem: unit em domínio puro (máquina de estados, validação por-rede) é a prioridade.

## UI

- Base: componentes **shadcn** (estilo `base-nova`, sobre **Base UI**). O pacote `shadcn` é dependência
  porque `globals.css` importa `shadcn/tailwind.css` (camada de utilitários do estilo).
- **Não modificar** componentes em `src/components/ui/`; criar wrappers ao lado.
- Tema: tokens em `src/app/globals.css` (oklch), claro/escuro via `next-themes` (classe). Ver APP-ADR-001.
- Linguagem visual "cabine de publicação": canvas claro + trilho lateral escuro; primária índigo; cada
  estado da máquina com cor semântica própria (`--status-*`).
- **PT-BR** em toda a interface.
- Datas/horas formatadas em timezone **fixo** (America/Sao_Paulo) para render idêntico servidor/cliente.
- Acessibilidade: `aria-label` quando o texto não basta; foco visível; suporte a teclado.

## Antipadrões deste projeto

- Lógica de domínio dentro de componente React — vive em `src/domain/`.
- Acoplar a UI à forma do invólucro do push do MC — só o `content` v1 é território deste app.
- `utils.ts`/`helpers.ts` genérico de despejo — função vive no domínio dela.
- Chamar `new Date()`/`Date.now()` para dados que renderizam no servidor e no cliente sem timezone fixo
  (causa hydration mismatch) — use o relógio do app (`APP_NOW_ISO`) e os formatters de `lib/format`.
- Commit gigante — pequenos e semânticos; fase grande = vários commits.

# DÉBITO TÉCNICO

> Só débito **aberto**. Cada item: `D-xxx — descrição em 1 linha — severidade`.
> Severidade sugerida: 🔴 bloqueante | 🟡 importante | 🔵 baixo / aceito como limitação.
> Resolvido → move pra `docs/history/DEBITO-RESOLVIDO.md` com nota de como foi resolvido.
> Nada some em silêncio.
> Veja `examples/docs/DEBITO-TECNICO.md` pra um exemplo preenchido.

- D-001 — sem testes automatizados; máquina de estados (`src/domain/state-machine.ts`) e validação por-rede (`src/domain/networks.ts`) são domínio puro e merecem cobertura unit — 🔵
- D-003 — [pedido p/ o chat] definir a spec da área de Configurações/Admin (token + URL de callback do MC, OAuth das redes); hoje é só placeholder visual em `/config` — 🟡
- D-005 — inbox real **em memória no servidor** (`src/io/mc-inbox.server.ts`); posts recebidos do MC **somem no restart** do processo, até F-persistência — 🔵 (limitação aceita; ver APP-ADR-002)
- D-006 — [pedido p/ o chat] **persistência/BD ainda indefinida**: como salvar posts recebidos, estados e resultados (Postgres/Drizzle? outro?); enquanto não definido, server e cliente seguem em memória — 🟡
- D-007 — recepção real não orquestra publicação no servidor (o `MockPublisher` é client-side); um push `autoPublish:true` cai em `aRevisar` em vez de publicar ao receber; revisar em F-oauth-redes/F-persistência — 🔵
- D-008 — `next build` falha ao coletar `/_not-found` (`PageNotFoundError: Cannot find module for page: /_not-found`), reproduzível **no tree limpo** (pré-existente, não introduzido por F-002); `tsc`, `eslint` e o passo de compilação do build passam, e o `next dev` roda normal. Parece drift do Turbopack/Next 15.5.x; investigar (pin de versão? `next build` sem `--turbopack`?) — 🟡

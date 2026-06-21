# DÉBITO TÉCNICO

> Só débito **aberto**. Cada item: `D-xxx — descrição em 1 linha — severidade`.
> Severidade sugerida: 🔴 bloqueante | 🟡 importante | 🔵 baixo / aceito como limitação.
> Resolvido → move pra `docs/history/DEBITO-RESOLVIDO.md` com nota de como foi resolvido.
> Nada some em silêncio.
> Veja `examples/docs/DEBITO-TECNICO.md` pra um exemplo preenchido.

- D-001 — sem testes automatizados; máquina de estados (`src/domain/state-machine.ts`) e validação por-rede (`src/domain/networks.ts`) são domínio puro e merecem cobertura unit — 🔵
- D-002 — [pedido p/ o chat] contrato de recepção do MC em aberto (§6.B: formato do corpo, id consultável, headers do invólucro); confirmar no chat do MC antes de implementar F-int-mc — 🟡
- D-003 — [pedido p/ o chat] definir a spec da área de Configurações/Admin (token + URL de callback do MC, OAuth das redes); hoje é só placeholder visual em `/config`; depende de D-002 — 🟡
- D-004 — [pedido p/ o chat] definir UX de Inbox × Calendário (mesmos dados, visões diferentes) e se entra um modo kanban; hoje Inbox = fila de ação, Calendário = visão temporal — 🔵

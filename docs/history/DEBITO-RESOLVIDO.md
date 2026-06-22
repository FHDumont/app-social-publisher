# DÉBITO RESOLVIDO

> Débito **fechado**, com nota de como/quando foi resolvido. Append quando um item sai de `docs/DEBITO-TECNICO.md`. Imutável.
> Veja `examples/docs/history/DEBITO-RESOLVIDO.md` pra um exemplo preenchido.

- **D-002** — formato do invólucro do push do MC (§6.B). **Resolvido empiricamente em F-int-mc** pelo teste de ponta a ponta com o MC. Formato real confirmado: `{ jobId, status, output: [ { type: "text", content: "<JSON v1 como string>" } ] }` — o `content` v1 vem como **string JSON** dentro de um item de `output` com `type:"text"` (não objeto, não `type:"post"`). O parser defensivo (`src/io/mc-wrapper.ts`) foi ajustado para varrer `output` ignorando `type:"file"` e fazer `JSON.parse` quando o `content` é string. Validado via curl pela cadeia real (`https://social.lab/mc/callback` → `202`, `source=body.output[].content`, post na inbox). Mídia (`file` parts) e formatos aninhados mais profundos seguem fora do escopo até surgirem.

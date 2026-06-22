# APP-ADR-003 — UX de visões: Inbox=ação, Calendário=tempo; sem kanban

- **Status:** accepted
- **Data:** 2026-06-22
- **Fase:** F-002

## Contexto

Inbox e Calendário mostram **os mesmos posts**, sobre o mesmo modelo (`content` v1) e a mesma
máquina de estados (`aRevisar | agendado | publicado | falhou` + flag `rejected`). Sem uma
regra explícita de papéis, as duas telas tendiam a virar duas listas redundantes do mesmo
conjunto, e o estado de cada post não aparecia no lugar certo: em F-001 o Calendário mostrava
até posts `aRevisar`+`now` (que não têm horário próprio), e a Inbox separava `aRevisar` e
`falhou` em abas distintas, sem noção de urgência. `D-004` registrava essa indefinição (e a
dúvida sobre entrar um modo kanban).

Forças em jogo:

- Os mesmos dados precisam servir a **duas perguntas diferentes**: "o que preciso decidir
  agora?" (ação) e "o que sai quando e onde?" (tempo). Misturá-las polui as duas.
- A transição entre estados **não é** arrastar-e-soltar — é `aprovar`/`agendar`/`tratar` pela
  máquina de estados, que já decide o destino a partir de `autoPublish`+`schedule`.
- O invariante "nada some em silêncio" (CONVENCOES) vale para `falhou` e para `rejected`.

## Decisão

**Dois eixos, papéis separados:**

- **Inbox = eixo de ação.** Mostra **só o que exige decisão humana agora**: posts `aRevisar`
  e `falhou` (não recusados), numa **única lista ordenada por urgência** — falhas primeiro
  (exigem reação), depois pendências por proximidade temporal (as com `schedule.at` por
  proximidade do horário-alvo; as `now` em seguida). Ao agir (aprovar/recusar/tratar), o item
  **sai** da lista de ação (muda de estado ou de flag). Posts `rejected` saem da lista de ação
  mas permanecem num **filtro secundário "Recusados"** (visíveis, reversíveis por "Restaurar").

- **Calendário = eixo de tempo.** Mostra **só o que tem lugar no tempo**, com tratamento
  visual por estado:
  - `agendado` → bloco **firme** no horário futuro.
  - `publicado` → registro no passado.
  - `falhou` → marca **de falha (vermelha)** no horário em que era para sair.
  - `aRevisar`+`schedule.at` → bloco **fantasma/tracejado** no horário-alvo (não confirmado;
    depende de aprovação).
  - `aRevisar`+`schedule.now` → **não aparece** (não tem horário próprio; vive só na Inbox).
  - `rejected` → não aparece (já era assim).

**A transição fantasma→firme é reativa pela máquina de estados.** Aprovar um `aRevisar`+`at`
(pela página do post) chama `decideOnApprove`, que o leva a `agendado`; o Calendário, ligado
ao mesmo store, re-renderiza o bloco de tracejado para firme sozinho. **Não** há ação de
aprovar inline no calendário (decidido com o dono: KISS/YAGNI — a aprovação mora na página do
post, e a visão de tempo só reflete).

**Sem kanban (por ora).** Não há colunas-por-estado com arrastar-e-soltar. O estado já é
legível nas duas visões (badge/pill na Inbox, tratamento visual no Calendário), e a transição
entre estados é decisão da máquina, não um drag. Fica registrado como ideia futura, a
reabilitar só se o fluxo pedir (ver "Consequências").

## Alternativas consideradas

- **Kanban (colunas por estado, drag-and-drop)** — atraente visualmente, mas: (a) duplicaria a
  informação de estado que a Inbox e o Calendário já carregam; (b) sugeriria que mover o card
  muda o estado, quando a transição real depende de `autoPublish`+`schedule` e da publicação
  (mock) — um drag de `aRevisar`→`publicado` seria mentira de UI. Over-engineering para o fluxo
  atual (YAGNI). Reavaliar se surgir necessidade de triagem em massa por estado.
- **Aprovar inline no bloco do calendário** — atende "aprovar pelo calendário" ao pé da letra,
  mas adiciona UI de ação à visão de tempo (em três variantes: mês/semana/dia) sem ganho real:
  o bloco já é um link para a página do post, onde a aprovação tem todo o contexto. O dono
  optou pelo caminho reativo.
- **Manter `aRevisar`+`now` no calendário (em `createdAt`)** — como em F-001. Mas `now` não tem
  horário próprio: posicioná-lo em `createdAt` mistura "quando foi criado" com "quando sai",
  poluindo o eixo de tempo com itens que pertencem só ao eixo de ação.
- **Tirar `Recusados` da Inbox** (já que "Inbox = só ação") — quebraria "nada some em
  silêncio": recusados não aparecem no calendário, então sumiriam de tudo. Mantidos como filtro
  secundário.

## Consequências

Habilita ler cada visão pela pergunta que ela responde, sem redundância: a Inbox é a fila de
decisões ordenada por urgência; o Calendário é a linha do tempo do que sai/saiu, com o estado
de cada item legível pelo tratamento visual (incluindo o "fantasma" do que ainda depende de
aprovação). A coerência entre as duas é mantida de graça pela máquina de estados + store
reativo, sem código de sincronização novo.

Custos / trade-offs aceitos:

- **Sem triagem em massa por estado** (o que um kanban daria). Aceito enquanto o volume e o
  fluxo não pedirem; a porta fica registrada aqui.
- **"Aprovar" não está no calendário**: quem vê um fantasma e quer firmá-lo passa pela página
  do post. Um clique a mais, em troca de manter a visão de tempo só-leitura e simples.
- A regra de distribuição vira **acoplamento implícito** entre os filtros da Inbox e do
  Calendário: se um estado novo entrar na máquina, as duas telas precisam decidir onde ele cai.
  Mitigado por este ADR ser a fonte da regra.

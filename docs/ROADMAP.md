# ROADMAP

> Fases futuras + a fase atual. **1 linha por fase** (ID + objetivo).
> A fase sai daqui quando é concluída (vide regra de migração em AGENTS.md).
> Veja `examples/docs/ROADMAP.md` pra um exemplo preenchido.

## Atual

- (nenhuma — F-int-mc entregue; aguardando aprovação do dono para seguir para F-002)

## Próximas

- **F-config-admin** — área de Configurações/Admin de verdade (token + callback do MC, OAuth/conexão de contas, políticas de publicação/notificação); hoje só placeholder visual em `/config` (ver D-003).
- **F-mídia** — download e persistência local da mídia vinda do MC ao receber (regra do 410/expiração em ~3 dias).
- **F-oauth-redes** — OAuth e publicação real em cada rede (LinkedIn, X, Instagram, YouTube, WordPress/Newsletter).
- **F-persistência** — persistência real (Postgres/Drizzle) substituindo o estado em memória.
- **F-extras** — analytics, biblioteca de mídia como feature, tags, repetição de post (escopo a destrinchar quando fizerem falta).

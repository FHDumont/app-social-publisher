#!/usr/bin/env bash
#
# Inicia o app. Por enquanto só o ambiente "lab" (dev local).
#
# Uso:
#   scripts/start.sh [ambiente]      # ambiente padrão: lab
#   PORT=3011 scripts/start.sh lab   # porta customizada (padrão: 3010)
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENVIRONMENT="${1:-lab}"
PORT="${PORT:-3010}"

if [[ "$ENVIRONMENT" != "lab" ]]; then
  echo "Ambiente '$ENVIRONMENT' ainda não é suportado. Use: lab" >&2
  exit 1
fi

RUN_DIR="$ROOT/.run"
PID_FILE="$RUN_DIR/$ENVIRONMENT.pid"
LOG_FILE="$RUN_DIR/$ENVIRONMENT.log"
mkdir -p "$RUN_DIR"

# Já está rodando?
if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "lab já está rodando (PID $(cat "$PID_FILE"))."
  echo "Pare antes com: scripts/stop.sh"
  exit 0
fi

echo "Iniciando lab (Next dev) na porta ${PORT}..."
# nohup + setsid (quando disponível) para sobreviver ao término do shell.
if command -v setsid >/dev/null 2>&1; then
  setsid npm run dev -- -p "$PORT" >"$LOG_FILE" 2>&1 &
else
  nohup npm run dev -- -p "$PORT" >"$LOG_FILE" 2>&1 &
fi
echo $! >"$PID_FILE"

echo "Rodando - PID $(cat "$PID_FILE") - log: ${LOG_FILE#"$ROOT"/}"
echo "URL:  http://localhost:$PORT"
echo "Logs: tail -f ${LOG_FILE#"$ROOT"/}"

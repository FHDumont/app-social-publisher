#!/usr/bin/env bash
#
# Para o app. Por enquanto só o ambiente "lab" (dev local).
#
# Uso:
#   scripts/stop.sh [ambiente]      # ambiente padrão: lab
#   PORT=3011 scripts/stop.sh lab   # mesma porta usada no start (padrão: 3010)
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

stopped=0

# 1) Mata o processo do pidfile e seus filhos (npm → next).
if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE")"
  if kill -0 "$PID" 2>/dev/null; then
    echo "Parando lab (PID $PID)..."
    pkill -P "$PID" 2>/dev/null || true
    kill "$PID" 2>/dev/null || true
    stopped=1
  fi
  rm -f "$PID_FILE"
fi

# 2) Fallback: libera a porta se algo ficou pendurado.
if command -v lsof >/dev/null 2>&1; then
  leftover="$(lsof -ti tcp:"$PORT" 2>/dev/null || true)"
  if [[ -n "$leftover" ]]; then
    echo "Liberando porta ${PORT}..."
    echo "$leftover" | xargs kill 2>/dev/null || true
    stopped=1
  fi
fi

if [[ "$stopped" -eq 1 ]]; then
  echo "lab parado."
else
  echo "lab não estava rodando."
fi

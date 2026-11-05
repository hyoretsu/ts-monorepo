#!/bin/sh
# Docker invokes this inside the dev container. Only PID 1 is signalled.
if bun /app/scripts/dev-healthcheck.ts; then
  echo 0 > /tmp/template-dev-health-failures
  exit 0
fi

started=$(cat /tmp/template-dev-started-at 2>/dev/null || date +%s)
now=$(date +%s)
if [ "$((now - started))" -lt 300 ]; then
  exit 1
fi

failures=$(cat /tmp/template-dev-health-failures 2>/dev/null || echo 0)
failures=$((failures + 1))
echo "$failures" > /tmp/template-dev-health-failures
if [ "$failures" -ge 3 ]; then
  echo 'Health checks failed three times; restarting development container.'
  kill -TERM 1
fi
exit 1

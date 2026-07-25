
#!/bin/bash
# .claude/hooks/pre_tool.sh
# Вторая линия защиты после permissions.deny: блокирует опасные команды,
# даже если они пришли в обход паттернов deny (пайпы, подстановки и т.п.)
# Claude Code передаёт JSON с деталями вызова через stdin.
 
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | grep -o '"command"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1)
 
DANGEROUS='(git push|git reset --hard|rm -rf|DROP TABLE|TRUNCATE|DELETE FROM|supabase db|psql|ssh |scp |docker (rm|stop|down|system prune)|kubectl)'
 
if echo "$COMMAND" | grep -qiE "$DANGEROUS"; then
  echo "BLOCKED by pre_tool hook: potentially destructive command on production." >&2
  echo "Command: $COMMAND" >&2
  echo "If this is intentional, the user must run it manually." >&2
  exit 2
fi
 
exit 0
 
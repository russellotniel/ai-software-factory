#!/usr/bin/env bash
# verify-foundation.sh
#
# Gunawan pre-tool hook — foundation integrity check.
# Runs before every substantive Claude Code tool call.
# Blocks the operation if required foundation files are missing or empty.
#
# Configure in .claude/settings.json:
#   "hooks": {
#     "PreToolUse": [{
#       "matcher": "Edit|Write|MultiEdit|Bash",
#       "hooks": [{"type": "command", "command": "bash .claude/hooks/verify-foundation.sh"}]
#     }]
#   }

FOUNDATION=".gunawan/foundation"

REQUIRED_FILES=(
  "$FOUNDATION/human-intent-os/mission.md"
  "$FOUNDATION/human-intent-os/risk-policy.md"
  "$FOUNDATION/agent-foundation-os/task-lifecycle.md"
  "$FOUNDATION/agent-foundation-os/escalation-policy.md"
  "$FOUNDATION/role-definition-os/role-map.md"
)

MISSING=()

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -s "$file" ]; then
    MISSING+=("$file")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "GATE BLOCKED: Gunawan foundation is incomplete."
  echo ""
  echo "Missing or empty:"
  for f in "${MISSING[@]}"; do
    echo "  - $f"
  done
  echo ""
  echo "Action required: ensure .gunawan/ is present and non-empty."
  echo "No workflow may proceed until the foundation is intact."
  exit 1
fi

exit 0

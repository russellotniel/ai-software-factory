#!/usr/bin/env bash
# protect-critical-files.sh
#
# Gunawan pre-tool hook — protected file escalation.
# Runs before Edit/Write/MultiEdit operations.
# Blocks the operation if Claude attempts to modify a protected file
# without the operation being preceded by explicit human approval.
#
# Configure in .claude/settings.json:
#   "hooks": {
#     "PreToolUse": [{
#       "matcher": "Edit|Write|MultiEdit",
#       "hooks": [{"type": "command", "command": "bash .claude/hooks/protect-critical-files.sh"}]
#     }]
#   }
#
# Claude Code passes tool input as JSON on stdin.
# We extract the file_path field and check it against protected patterns.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')

if [ -z "$FILE_PATH" ]; then
  # No file_path in input — not a file edit, allow through
  exit 0
fi

# Normalize to forward slashes for pattern matching
FILE_PATH_NORM=$(echo "$FILE_PATH" | sed 's/\\/\//g')

# Protected patterns — any match blocks the operation
PROTECTED_PATTERNS=(
  "CLAUDE\.md$"
  "\.gunawan/"
  "\.env"
  "supabase/migrations/"
  "\.github/workflows/"
  "k8s/"
  "\.claude/settings\.json$"
  "src/lib/supabase\.ts$"
  "src/middleware\.ts$"
  "next\.config\."
  "src/lib/env\.ts$"
)

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if echo "$FILE_PATH_NORM" | grep -qE "$pattern"; then
    echo "ESCALATION REQUIRED: Protected file modification blocked."
    echo ""
    echo "File: $FILE_PATH"
    echo "Pattern matched: $pattern"
    echo ""
    echo "This file is protected under the Gunawan protocol."
    echo "Claude must not modify it without explicit human approval."
    echo ""
    echo "To proceed: explicitly tell Claude you approve this specific change,"
    echo "then Claude may make the modification in the next turn."
    exit 1
  fi
done

exit 0

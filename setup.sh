#!/bin/bash
# AI Software Factory — Setup Script
# Run this once after cloning the repository
# Usage: bash setup.sh

echo "Setting up AI Software Factory..."

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
  echo "Error: Please run this script from the root of the ai-software-factory directory"
  exit 1
fi

echo "✅ Directory confirmed"

# Make commands executable
chmod +x .claude/commands/**/*.md 2>/dev/null || true

echo "✅ Setup complete"
echo ""
echo "Next steps:"
echo "1. Open Claude Code: claude"
echo "2. Start with: /foundation:discover"
echo ""
echo "Documentation: https://github.com/russellotniel/ai-software-factory"

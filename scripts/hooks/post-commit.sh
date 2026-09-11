#!/bin/sh
# post-commit — deterministic memory generation
# Installed by copying to .git/hooks/post-commit:
#   cp scripts/hooks/post-commit.sh .git/hooks/post-commit && chmod +x .git/hooks/post-commit

node scripts/memory.mjs --hook

# Exit 0 so commit stays successful even if memory generation warnings occur
exit 0

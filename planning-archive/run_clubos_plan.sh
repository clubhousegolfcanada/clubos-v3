#!/bin/bash
echo "🧠 Bootstrapping ClubOS V2 Execution Plan..."

PLAN_PATH="./Notes/Clubhouse OS V2 Plan.md"
BUILD_LOG="./Logs/build.log"

echo "📄 Using Plan: $PLAN_PATH"
echo "📂 Logging to: $BUILD_LOG"
echo ""

if [ ! -f "$PLAN_PATH" ]; then
  echo "❌ Plan file not found. Aborting."
  exit 1
fi

# Run Claude bootstrap prompt
cat << EOF
Begin executing the ClubOS V2 build based on:
$PLAN_PATH

Start with Phase 1: Initial Scaffolding.
Log all completed steps to $BUILD_LOG.
If this is a continuation, resume from the last completed line in build.log.

Do not wait for confirmation. Only pause if blocked by missing secrets, permissions, or external systems.
EOF

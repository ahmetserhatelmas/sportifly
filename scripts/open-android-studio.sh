#!/bin/bash
# Android Studio'yu node PATH'i ile açar (GUI'den açınca Homebrew görünmez).
set -euo pipefail
export PATH="/opt/homebrew/opt/node@22/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/android"
./gradlew --stop >/dev/null 2>&1 || true
exec "/Applications/Android Studio.app/Contents/MacOS/studio" "$ROOT/android"

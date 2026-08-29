#!/bin/bash
# Release APK üretir → ~/Desktop/sportifly-release.apk
set -euo pipefail
export PATH="/opt/homebrew/opt/node@22/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
export JAVA_HOME="${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/android"
./gradlew assembleRelease
APK="$(ls -t "$ROOT"/android/app/build/outputs/apk/release/*.apk | head -1)"
cp -f "$APK" "$HOME/Desktop/sportifly-release.apk"
echo "APK hazır: $HOME/Desktop/sportifly-release.apk"
ls -lh "$HOME/Desktop/sportifly-release.apk"

#!/usr/bin/env bash
# Run SwiftLint across the iOS sources. Used as an Xcode build phase script
# and from CI.
set -euo pipefail

if ! command -v swiftlint >/dev/null 2>&1; then
  echo "warning: swiftlint not installed (brew install swiftlint)"
  exit 0
fi

cd "$(dirname "$0")/.."
swiftlint --config .swiftlint.yml "$@"

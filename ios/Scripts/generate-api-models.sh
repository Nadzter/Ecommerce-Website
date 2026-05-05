#!/usr/bin/env bash
# Regenerate Swift models from shared/openapi/amwali.yaml using
# swift-openapi-generator. Run this whenever the OpenAPI spec changes; commit
# the generated files alongside the spec change.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SPEC="${ROOT}/shared/openapi/amwali.yaml"
OUTPUT_DIR="${ROOT}/ios/AmwaliKit/API/Generated"

mkdir -p "${OUTPUT_DIR}"

if ! command -v swift-openapi-generator >/dev/null 2>&1; then
  echo "swift-openapi-generator not found. Install via Swift Package Manager"
  echo "in Xcode (File → Add Packages → swift-openapi-generator) or via"
  echo "the package plugin during build."
  exit 1
fi

swift-openapi-generator \
  --input "${SPEC}" \
  --output-directory "${OUTPUT_DIR}" \
  --mode types \
  --mode client

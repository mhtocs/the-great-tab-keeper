#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

if [[ ! -f dist/manifest.json ]]; then
  echo "dist/ missing, run npm run build first" >&2
  exit 1
fi

version="${1:-$(node -p "require('./package.json').version")}"
out="${root}/the-great-tab-keeper-v${version}.zip"

rm -f "$out"
(cd dist && zip -rq "$out" .)
echo "$out"

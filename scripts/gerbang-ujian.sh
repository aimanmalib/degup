#!/usr/bin/env bash
# Gerbang ujian Degup: tempatan (`bash scripts/gerbang-ujian.sh`) dan Depot CI (.depot/workflows/gerbang.yml).
# Urutan: had saiz fail → tsc → vitest (termasuk kata larangan §4.8 + pariti lang) → build → Playwright Electron (xvfb).
# Langkah yang belum wujud (build sebelum esbuild.config.mjs, Playwright sebelum e2e/) dilangkau dengan mesej, bukan senyap.
set -euo pipefail
cd "$(dirname "$0")/.."

langkah() { printf '\n== %s\n' "$*"; }
MAKS_BARIS=800

langkah "had saiz fail (≤ $MAKS_BARIS baris)"
besar=$(git ls-files -co --exclude-standard -- src tests scripts e2e config lang 2>/dev/null \
  | grep -vE '\.json$' | while read -r f; do [ -f "$f" ] && n=$(wc -l <"$f") && [ "$n" -gt "$MAKS_BARIS" ] && echo "$f ($n)"; done || true)
[ -z "$besar" ] || { echo "fail melebihi $MAKS_BARIS baris: $besar"; exit 1; }
echo ok

langkah "tsc --noEmit (teras/main/ujian + renderer DOM)"
npx --no-install tsc --noEmit -p tsconfig.json
npx --no-install tsc --noEmit -p tsconfig.renderer.json
echo ok

langkah "vitest (unit + kata larangan + pariti lang)"
npx --no-install vitest run --reporter=dot

if [ -f esbuild.config.mjs ]; then
  langkah "build (esbuild)"
  node esbuild.config.mjs
else
  langkah "build: dilangkau (esbuild.config.mjs belum wujud; P3a)"
fi

if [ -d e2e ] && [ -f playwright.config.ts ]; then
  langkah "Playwright Electron (xvfb)"
  if ! command -v xvfb-run >/dev/null; then
    if command -v sudo >/dev/null && command -v apt-get >/dev/null; then
      sudo apt-get update -qq && sudo apt-get install -y -qq xvfb >/dev/null
    else
      echo "xvfb-run tiada dan tidak boleh dipasang"; exit 1
    fi
  fi
  # `xvfb-run -a` hanya menyemak /tmp/.X<n>-lock; hos dikongsi menyimpan soket /tmp/.X11-unix/X<n> tanpa kunci (sesi lain,
  # /tmp peribadi), jadi Xvfb gagal 10 kali dan xvfb-run keluar 1 walaupun ujian lulus. Pilih paparan yang tiada kunci DAN soket.
  paparan=99
  while [ -e "/tmp/.X${paparan}-lock" ] || [ -e "/tmp/.X11-unix/X${paparan}" ]; do paparan=$((paparan + 1)); done
  DEGUP_SUMBER="${DEGUP_SUMBER:-sim}" xvfb-run -a -n "$paparan" npx --no-install playwright test --reporter=line
else
  langkah "Playwright: dilangkau (e2e/ belum wujud; P3a)"
fi

printf '\ngerbang-ujian LULUS\n'

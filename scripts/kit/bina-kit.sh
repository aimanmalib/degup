#!/usr/bin/env bash
# Bina zip kit laptop pemilik (PELAN J6a/J6b, D22): pokok git BERTAG (git archive, jadi tiada node_modules, .env, dist atau
# fail diabaikan git) + mula.bat di akar + KIT-COMMIT + config kit ditindih (config/kit.json) + fail .sha256.
# Guna: bash scripts/kit/bina-kit.sh <tag|ref> [folder_keluar]   (lalai folder keluar: ~/portal/uploads, nama hackathon-degup-kit-<tag>.zip)
set -euo pipefail
cd "$(dirname "$0")/../.."

ref="${1:?guna: bina-kit.sh <tag|ref> [folder_keluar]}"
keluar="${2:-$HOME/portal/uploads}"
awalan="${KIT_AWALAN:-hackathon-degup-kit-}"
komit=$(git rev-parse --verify "${ref}^{commit}")
nama="${awalan}${ref//\//-}"
akar="degup-kit-${ref//\//-}"

kerja=$(mktemp -d)
trap 'rm -rf "$kerja"' EXIT
git archive --format=tar --prefix="$akar/" "$komit" | tar -x -C "$kerja"
pokok="$kerja/$akar"

for f in config/app.json config/kit.json scripts/kit/mula.bat scripts/kit/gabung-config.mjs package-lock.json; do
  [ -f "$pokok/$f" ] || { echo "kit: $f tiada dalam $ref"; exit 1; }
done
node "$pokok/scripts/kit/gabung-config.mjs" "$pokok/config/app.json" "$pokok/config/kit.json"
printf '%s %s\n' "$komit" "$ref" >"$pokok/KIT-COMMIT"
# Windows cmd memerlukan CRLF.
sed 's/\r$//; s/$/\r/' "$pokok/scripts/kit/mula.bat" >"$pokok/mula.bat"

# Pagar: tiada rahsia, kebergantungan, binaan atau media dalam zip.
larangan=$(cd "$pokok" && find . \( -name '.env' -o -name '.env.*' ! -name '.env.example' -o -name node_modules -o -name dist \
  -o -name '*.webm' -o -name '*.mp4' -o -name '*.mov' -o -name '*.mkv' -o -name '*.y4m' \) -print)
[ -z "$larangan" ] || { echo "kit: fail dilarang dalam pokok: $larangan"; exit 1; }

mkdir -p "$keluar"
zip_fail="$keluar/$nama.zip"
rm -f "$zip_fail" "$zip_fail.sha256"
(cd "$kerja" && zip -qrX "$zip_fail" "$akar")
(cd "$keluar" && sha256sum "$nama.zip" >"$nama.zip.sha256")
echo "kit: $zip_fail"
echo "kit: komit $komit ($ref)"
cat "$zip_fail.sha256"

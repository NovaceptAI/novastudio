#!/usr/bin/env bash
# Build NovaStudio and publish it to /var/www/novastudio.
#
# The build happens in a scratch directory and is only copied over once it has
# succeeded, so a failed build never leaves the live site half-written.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
WEB_ROOT=/var/www/novastudio
OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

cd "$REPO"
npx tsc -b
npx vite build --outDir "$OUT" --emptyOutDir

sudo mkdir -p "$WEB_ROOT"
# Copy hashed assets first and index.html last, so no browser is ever handed an
# index.html that points at chunks that are not there yet. Chunks from earlier
# builds are kept for a week, so a tab still open on an older version can
# lazy-load its screens, then removed.
sudo rsync -a "$OUT/static/" "$WEB_ROOT/static/"
sudo rsync -a --exclude index.html --exclude static "$OUT/" "$WEB_ROOT/"
sudo install -m 644 "$OUT/index.html" "$WEB_ROOT/index.html"
sudo find "$WEB_ROOT/static" -type f -mtime +7 -delete
sudo chown -R root:root "$WEB_ROOT"
# mktemp directories are 0700 and rsync -a carries that across; nginx workers
# need to read everything.
sudo chmod -R u=rwX,go=rX "$WEB_ROOT"

echo "Deployed $(git rev-parse --short HEAD) to $WEB_ROOT"

#!/usr/bin/env bash

set -e

# ---- CONFIG ----
VERSION=$1
BUCKET_URL="https://vpdubtsixxkxeapbpmeb.supabase.co/storage/v1/object/public/firmware"

# Path to your compiled binary
BIN_PATH="build/esp32.esp32.esp32/blinky.ino.bin"

# ---- VALIDATION ----
if [ -z "$VERSION" ]; then
  echo "Usage: ./generate-manifest.sh <version>"
  exit 1
fi

if [ ! -f "$BIN_PATH" ]; then
  echo "Binary not found at $BIN_PATH"
  exit 1
fi

# ---- DERIVE VALUES ----

# Git short hash
GIT_HASH=$(git rev-parse --short HEAD)

# Final filename
FILENAME="v${VERSION}-${GIT_HASH}.bin"

# Copy/rename binary
cp "$BIN_PATH" "$FILENAME"

# SHA256
SHA256=$(shasum -a 256 "$FILENAME" | awk '{print $1}')

# File size (bytes)
SIZE=$(stat -f%z "$FILENAME")

# URL
URL="${BUCKET_URL}/${FILENAME}"

# ---- OUTPUT MANIFEST ----

cat <<EOF
{
  "version": "${VERSION}",
  "url": "${URL}",
  "sha256": "${SHA256}",
  "size": ${SIZE}
}
EOF

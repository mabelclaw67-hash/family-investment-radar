#!/usr/bin/env bash
# Idempotently provision the vendored daily_stock_analysis (DSA) checkout at a
# PINNED version, and (optionally) the Python venv. Safe to run repeatedly and
# on a fresh machine or in CI — it never floats to DSA main.
#
#   ./bootstrap.sh            # ensure vendor/ is at the pinned SHA
#   ./bootstrap.sh --venv     # also create .venv and install requirements.txt
#
# Pinned to DSA release v3.26.1. To bump: change DSA_REF + DSA_SHA together,
# re-run, and update analysis-engine/README.md.
set -euo pipefail

DSA_REPO="https://github.com/ZhuLinsen/daily_stock_analysis.git"
DSA_REF="v3.26.1"                                          # release tag
DSA_SHA="e8a9ca7742e8cb2498c8f491dd76d239b3064e1a"        # exact commit for that tag

ENGINE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENDOR_DIR="${ENGINE_DIR}/vendor/daily_stock_analysis"

ensure_vendor() {
  if [ -d "${VENDOR_DIR}/.git" ]; then
    local current
    current="$(git -C "${VENDOR_DIR}" rev-parse HEAD 2>/dev/null || echo none)"
    if [ "${current}" = "${DSA_SHA}" ]; then
      echo "[bootstrap] DSA already at pinned ${DSA_REF} (${DSA_SHA:0:7}); skipping clone."
      return
    fi
    echo "[bootstrap] DSA at ${current:0:7}, re-pinning to ${DSA_REF} (${DSA_SHA:0:7})..."
    git -C "${VENDOR_DIR}" fetch --depth 1 origin "tag" "${DSA_REF}"
    git -C "${VENDOR_DIR}" checkout --quiet "${DSA_SHA}"
  else
    echo "[bootstrap] Cloning DSA ${DSA_REF} (${DSA_SHA:0:7})..."
    rm -rf "${VENDOR_DIR}"
    git clone --depth 1 --branch "${DSA_REF}" "${DSA_REPO}" "${VENDOR_DIR}"
  fi

  # Fail loudly if the pinned SHA does not match — never run a floating version.
  local got
  got="$(git -C "${VENDOR_DIR}" rev-parse HEAD)"
  if [ "${got}" != "${DSA_SHA}" ]; then
    echo "[bootstrap] ERROR: DSA HEAD ${got} != pinned ${DSA_SHA}" >&2
    exit 1
  fi
  echo "[bootstrap] DSA pinned OK at ${DSA_REF} (${got:0:7})."
}

ensure_venv() {
  local venv="${ENGINE_DIR}/.venv"
  if [ ! -d "${venv}" ]; then
    echo "[bootstrap] Creating venv..."
    python3 -m venv "${venv}"
  fi
  echo "[bootstrap] Installing requirements..."
  "${venv}/bin/pip" install --quiet --upgrade pip
  "${venv}/bin/pip" install --quiet -r "${ENGINE_DIR}/requirements.txt"
  echo "[bootstrap] venv ready: ${venv}"
}

ensure_vendor
if [ "${1:-}" = "--venv" ]; then
  ensure_venv
fi
echo "[bootstrap] Done."

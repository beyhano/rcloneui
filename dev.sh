#!/usr/bin/env bash
set -euo pipefail
exec wails dev -tags webkit2_41 "$@"

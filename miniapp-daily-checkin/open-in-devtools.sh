#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLI_PATH="${1:-/Applications/wechatwebdevtools.app/Contents/MacOS/cli}"

if [ ! -x "$CLI_PATH" ]; then
  echo "未找到微信开发者工具 CLI：$CLI_PATH"
  echo "请把 CLI 路径作为第一个参数传入，例如："
  echo "  ./open-in-devtools.sh /Applications/wechatwebdevtools.app/Contents/MacOS/cli"
  exit 1
fi

"$CLI_PATH" open --project "$PROJECT_DIR"
echo "已请求微信开发者工具打开项目：$PROJECT_DIR"

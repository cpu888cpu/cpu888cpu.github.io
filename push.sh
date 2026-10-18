#!/usr/bin/env bash
# 一键推送到 GitHub Pages
#
# 用法：
#   ./push.sh 你的Token
# 或者：
#   GITHUB_TOKEN=你的Token ./push.sh
#
# Token 需要 repo 权限（Fine-grained token 勾选 Contents: Read and write 即可）。
# 生成地址： https://github.com/settings/tokens

set -euo pipefail

USER_NAME="cpu888cpu"
REPO_NAME="cpu888cpu.github.io"
BRANCH="main"

TOKEN="${1:-${GITHUB_TOKEN:-}}"

if [[ -z "$TOKEN" ]]; then
  echo "用法: ./push.sh <你的GitHub Token>"
  exit 1
fi

cd "$(dirname "$0")"

# 清理可能残留的旧 remote
git remote remove origin >/dev/null 2>&1 || true

# 用带 token 的地址推送（只在本次 push 使用，结束后改回干净地址）
git remote add origin "https://${USER_NAME}:${TOKEN}@github.com/${USER_NAME}/${REPO_NAME}.git"

echo "→ 正在推送到 ${USER_NAME}/${REPO_NAME} ..."
git push -u origin "${BRANCH}"

# 把 remote 地址恢复成不带 token 的形式，避免明文留在 .git/config
git remote set-url origin "https://github.com/${USER_NAME}/${REPO_NAME}.git"

echo ""
echo "✅ 推送完成"
echo "接下来：打开 https://github.com/${USER_NAME}/${REPO_NAME}/settings/pages"
echo "  Source 选 Deploy from a branch → Branch 选 main → 目录 / (root) → Save"
echo "  等一两分钟后访问： https://${USER_NAME}.github.io"

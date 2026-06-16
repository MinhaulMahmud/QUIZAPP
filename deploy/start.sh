#!/data/data/com.termux/files/usr/bin/bash
# Start the Daily Quiz App in production mode
set -e

# Detect repo directory
REPO_DIR=""
for dir in ~/QUIZAPP ~/daily-quiz; do
  if [ -f "$dir/package.json" ] && [ -d "$dir/.next" ]; then
    REPO_DIR="$dir"
    break
  fi
done
if [ -z "$REPO_DIR" ] && [ -f "./package.json" ] && [ -d "./.next" ]; then
  REPO_DIR="$(pwd)"
fi
if [ -z "$REPO_DIR" ]; then
  echo "Error: No built app found. Run deploy/setup.sh first, or build with: npm run build"
  exit 1
fi

echo "Starting app from: $REPO_DIR"
cd "$REPO_DIR"

# Export .env vars safely
while IFS='=' read -r key value; do
  key="${key#"${key%%[![:space:]]*}"}"
  [[ -z "$key" || "$key" == \#* ]] && continue
  value="${value%\"}"; value="${value#\"}"
  value="${value%\'}"; value="${value#\'}"
  export "$key=$value"
done < .env

echo "=== Starting Daily Quiz App ==="
NODE_ENV=production npx next start --port 3000 &
APP_PID=$!
echo "App running on http://localhost:3000 (PID: $APP_PID)"

# Start Cloudflare Tunnel if installed
if command -v cloudflared &>/dev/null; then
  cloudflared tunnel --url http://localhost:3000 &
  CLOUD_PID=$!
  echo "Cloudflare Tunnel running (PID: $CLOUD_PID)"
  echo ""
  echo "Access your app at the Cloudflare URL shown above."
  echo "Set that URL as your Telegram webhook."
else
  echo ""
  echo "No cloudflared found. Access app at http://localhost:3000"
  echo "Install with: curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o \$PREFIX/bin/cloudflared && chmod +x \$PREFIX/bin/cloudflared"
fi

echo ""
echo "Press Ctrl+C to stop."

wait $APP_PID ${CLOUD_PID:-}

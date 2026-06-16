#!/data/data/com.termux/files/usr/bin/bash
# Start the Daily Quiz App in production mode
set -e

cd ~/daily-quiz

echo "=== Starting Daily Quiz App ==="

# Start the app
NODE_ENV=production npx next start --port 3000 &

APP_PID=$!
echo "App running on http://localhost:3000 (PID: $APP_PID)"

# Start Cloudflare Tunnel for public access
cloudflared tunnel --url http://localhost:3000 &

CLOUD_PID=$!
echo "Cloudflare Tunnel running (PID: $CLOUD_PID)"

echo ""
echo "Access your app at the Cloudflare URL shown above."
echo "Set that URL as your Telegram webhook."
echo ""
echo "Press Ctrl+C to stop both services."

# Wait for both
wait $APP_PID $CLOUD_PID

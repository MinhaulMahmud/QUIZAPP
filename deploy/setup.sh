#!/data/data/com.termux/files/usr/bin/bash
# Phone Server Setup — Daily Quiz App (Termux)
set -e

echo "=== 1. Install dependencies ==="
pkg update -y
pkg install -y nodejs-lts git

echo "=== 2. Clone the app ==="
cd ~
git clone https://github.com/MinhaulMahmud/QUIZAPP.git daily-quiz
cd daily-quiz

echo "=== 3. Install Node dependencies ==="
npm install

echo "=== 4. Configure environment ==="
echo ""
echo "You need two FREE cloud databases (no credit card required):"
echo ""
echo "  Postgres: https://neon.tech  (free tier, supports pgvector)"
echo "  Redis:    https://upstash.com (free tier, 30MB)"
echo ""
echo "Sign up using Google/GitHub — no credit card needed."
echo ""
read -p "Paste your Neon Postgres DATABASE_URL: " db_url
read -p "Paste your Upstash REDIS_URL: " redis_url
read -p "Enter your Telegram Bot Token: " bot_token
read -p "Enter your OpenRouter API Key: " openrouter_key

cat > .env << EOF
DATABASE_URL="${db_url}"
REDIS_URL="${redis_url}"
JWT_SECRET="daily-quiz-jwt-secret-change-in-prod"
ENCRYPTION_KEY="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
TELEGRAM_CHAT_ID=""
EOF

echo "=== 5. Push database schema ==="
npx prisma db push

echo "=== 6. Build for production ==="
npm run build

echo "=== 7. Install Cloudflare Tunnel (for public URL) ==="
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o $PREFIX/bin/cloudflared
chmod +x $PREFIX/bin/cloudflared

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start:"
echo "  cd ~/daily-quiz && bash deploy/start.sh"

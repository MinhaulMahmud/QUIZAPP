#!/data/data/com.termux/files/usr/bin/bash
# Phone Server Setup — Daily Quiz App (Termux)
set -e

# Detect if we're already inside a valid repo
REPO_DIR=""
if git rev-parse --git-dir &>/dev/null 2>&1; then
  REPO_DIR="$(pwd)"
  echo "✓ Detected existing repo at $REPO_DIR"
elif [ -d ~/QUIZAPP/.git ]; then
  REPO_DIR=~/QUIZAPP
  echo "✓ Found existing repo at $REPO_DIR"
fi

if [ -z "$REPO_DIR" ]; then
  echo "=== 1. Install dependencies ==="
  pkg update -y
  pkg install -y nodejs-lts git

  echo "=== 2. Clone the app ==="
  cd ~
  git clone https://github.com/MinhaulMahmud/QUIZAPP.git daily-quiz
  REPO_DIR=~/daily-quiz
else
  echo "=== Skipping clone (repo exists) ==="
fi

cd "$REPO_DIR"
echo "Working in: $REPO_DIR"

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

# Create .env step by step
> .env

echo "--- Postgres (Neon) ---"
echo "Paste your DATABASE_URL from Neon:"
read -r db_url
echo "DATABASE_URL=\"$db_url\"" >> .env

echo "--- Redis (Upstash) ---"
echo "Paste your REDIS_URL from Upstash (starts with redis://):"
read -r redis_url
echo "REDIS_URL=\"$redis_url\"" >> .env

echo "--- Telegram Bot ---"
echo "Paste your Bot Token from @BotFather:"
read -r bot_token
echo "TELEGRAM_BOT_TOKEN=\"$bot_token\"" >> .env

echo "--- OpenRouter AI ---"
echo "Paste your OpenRouter API Key:"
read -r openrouter_key
echo "OPENROUTER_API_KEY=\"$openrouter_key\"" >> .env

# Fixed values
echo 'JWT_SECRET="daily-quiz-jwt-secret-change-in-prod"' >> .env
echo 'ENCRYPTION_KEY="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"' >> .env
echo 'NEXT_PUBLIC_APP_URL="http://localhost:3000"' >> .env
echo 'TELEGRAM_CHAT_ID=""' >> .env

echo ""
echo "=== 5. Push database schema ==="
# Export env so prisma can read it (Termux compat)
export $(grep -v '^\s*#' .env | grep -v '^\s*$' | sed 's/^/export /' | sed 's/="/=/' | sed 's/"$//')

PRISMA_CMD="./node_modules/.bin/prisma"
if [ ! -f "$PRISMA_CMD" ]; then
  PRISMA_CMD="npx --yes prisma"
fi
$PRISMA_CMD db push

echo ""
echo "=== 6. Build for production ==="
npm run build

echo ""
echo "=== 7. Install Cloudflare Tunnel (for public URL) ==="
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o $PREFIX/bin/cloudflared 2>/dev/null
chmod +x $PREFIX/bin/cloudflared 2>/dev/null || echo "(cloudflared optional, skip if not needed)"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start the app:"
echo "  cd $REPO_DIR && bash deploy/start.sh"
echo ""

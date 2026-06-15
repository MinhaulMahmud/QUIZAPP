# Daily Quiz App

An AI-powered daily quiz platform with a **Next.js web dashboard** and **Telegram bot**. Generate quizzes on any topic, answer via inline keyboards, track progress with charts, and search past sessions.

## Stack

| Layer | Tech |
|-------|------|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Styling** | Tailwind CSS 4 |
| **Database** | PostgreSQL 17 via Prisma 7 (`@prisma/adapter-pg`) |
| **Cache** | Redis 7 (via ioredis) |
| **AI** | OpenRouter (GPT-4o-mini / Gemini 2.0 Flash) or local Ollama |
| **Bot** | Telegraf 4 (Telegram Bot API) |
| **Charts** | Recharts |
| **Auth** | JWT + bcryptjs, HTTP-only cookies |
| **Scheduler** | node-cron (in-app, no external cron service needed) |

## Features

- **Daily Quizzes** — AI generates 5 MCQ questions per topic at configured difficulty
- **Telegram Bot** — Receive quizzes in Telegram, tap to answer, get instant feedback
- **Practice Mode** — Generate targeted quizzes on weak areas identified from past scores
- **Progress Tracking** — Score trend line chart, per-topic history, streak calculation
- **Knowledge Base** — Full-text search across past sessions, questions, and summaries
- **Settings** — Encrypted storage for API keys (AES-256-GCM), configurable quiz time
- **Dashboard** — At-a-glance stats: active topics, today's quiz, streak, overall score
- **On-demand Generation** — `/quiz` generates and caches a quiz immediately if none exists for today

## Prerequisites

- **Node.js** 20+
- **Docker Desktop** (for PostgreSQL + Redis)

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd daily-quiz-app
npm install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL (with pgvector) on port 5432 and Redis on port 6379.

### 3. Configure environment

Copy the example env and fill in your keys:

```bash
cp .env.example .env
```

Required values in `.env`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Random string for signing tokens |
| `ENCRYPTION_KEY` | **64 hex chars** (32 bytes) for AES-256 |
| `NEXT_PUBLIC_APP_URL` | Your app URL (`http://localhost:3000` for dev) |

### 4. Create database tables

```bash
npx prisma db push
```

### 5. Start the dev server

```bash
npm run dev
```

### 6. Register and set up

1. Open **http://localhost:3000/register** and create an account
2. Go to **Settings** and configure:
   - **Telegram Bot Token** — get from [@BotFather](https://t.me/BotFather)
   - **OpenRouter API Key** — get from [openrouter.ai/keys](https://openrouter.ai/keys)
   - **Quiz Time** — when you want the daily quiz delivered
3. Go to **Topics** and add your first learning topic

### 7. Start the Telegram bot

In Settings, click **Start Bot** (or it starts automatically on boot). Then message your bot on Telegram with `/start` to register your chat ID.

### 8. Trigger a manual quiz

Send `/quiz` to the bot, or wait for the scheduled delivery.

## Project Structure

```
daily-quiz-app/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # Route handlers
│   │   │   ├── auth/         # Login, register, logout, me
│   │   │   ├── bot/          # Bot start & webhook
│   │   │   ├── cron/         # Morning & midnight cron endpoints
│   │   │   ├── dashboard/    # Aggregated dashboard data
│   │   │   ├── knowledge/    # Knowledge base search
│   │   │   ├── progress/     # Progress records
│   │   │   ├── settings/     # Settings CRUD
│   │   │   └── topics/       # Topics CRUD
│   │   ├── dashboard/        # Dashboard, progress charts, knowledge
│   │   ├── login/            # Login page
│   │   ├── register/         # Registration page
│   │   ├── settings/         # Settings page
│   │   ├── setup/            # Onboarding wizard
│   │   ├── topics/           # Topic management
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Landing page
│   ├── bot/
│   │   ├── index.ts          # Bot initialization & handlers
│   │   └── cron/             # Morning & midnight cron jobs
│   ├── components/ui/        # Shared UI components
│   ├── lib/
│   │   ├── ai.ts             # AI provider (OpenRouter/Ollama)
│   │   ├── auth.ts           # JWT auth utilities
│   │   ├── crypto.ts         # AES-256-GCM encryption
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── redis.ts          # Redis client singleton
│   │   ├── scheduler.ts      # node-cron scheduler
│   │   └── settings.ts       # Settings CRUD with encryption
│   ├── proxy.ts              # Auth middleware
│   └── types/                # Shared TypeScript interfaces
├── prisma/
│   └── schema.prisma         # Database schema
├── instrumentation.ts        # Server bootstrap (starts scheduler)
└── docker-compose.yml        # PostgreSQL + Redis
```

## API Reference

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Sign in
- `POST /api/auth/logout` — Sign out
- `GET /api/auth/me` — Current session

### Content
- `GET|POST|PATCH|DELETE /api/topics` — Topic CRUD
- `GET /api/dashboard` — Aggregated stats
- `GET /api/progress` — Progress records
- `GET /api/knowledge?q=` — Search knowledge base

### Bot & Scheduling
- `POST /api/bot/start` — Start bot (webhook or polling)
- `POST /api/bot/webhook` — Telegram webhook receiver
- `POST /api/cron/morning` — Trigger morning quiz (auth: `CRON_SECRET`)
- `POST /api/cron/midnight` — Trigger midnight processing (auth: `CRON_SECRET`)

### Settings
- `GET|POST /api/settings` — Read/write app settings

## Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Register chat ID + show help |
| `/quiz` | Get today's quiz (generates on-demand if none cached) |
| `/practice` | Generate practice quiz on weak areas |
| `/topic` | List your active topics |
| `/stats` | Show progress stats |
| `/help` | Show available commands |

## Scheduler

The app includes a built-in scheduler (node-cron) that:
- Runs the **morning cron** at the configured `quiz_time` — generates and sends daily quizzes
- Runs the **midnight cron** at 00:00 — processes answers, generates summaries, persists to DB

Change the quiz time in **Settings → Daily Quiz Time**. The scheduler reloads automatically.

## License

MIT

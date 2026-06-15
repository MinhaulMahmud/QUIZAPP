<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Memory

When starting work on a **new project** that lacks an `AGENTS.md`, create this file with a `# Project Memory` section and the sub-sections below. Always maintain it across sessions.

## Instructions for AI
- On every session: **read this file first** for full context.
- After making changes: **append session notes** at the end.
- Track: credentials, repo URLs, what was built, what's pending, infrastructure details.

# Session Log

Append new sessions at the end of this file when work is done.

## Session 1 — June 16, 2026

### Project
Daily Quiz App — AI-powered quiz platform with Telegram bot + Next.js dashboard.

### Credentials
- Admin: `admin@test.com` / `admin123456`
- Bot: **@careerlog_bot** (polling mode)
- Telegram token: stored encrypted in DB
- OpenRouter key: stored encrypted in DB

### Repo
https://github.com/MinhaulMahmud/QUIZAPP.git

### What Was Built
- **Bot**: Commands (`/quiz`, `/practice`, `/topic`, `/stats`, `/help`, `/start`), inline keyboard answer flow (A/B/C/D buttons), answer evaluation via AI, Redis-locked duplicate prevention. Chat ID auto-registers on `/start`.
- **Scheduler**: `node-cron` via `instrumentation.ts`. Morning cron at configured `quiz_time`, midnight cron at 00:00. Re-schedules when setting changes.
- **Dashboard**: Real stats (topic count, today's quiz, streak, score), progress charts (recharts LineChart), knowledge search (full-text across sessions/questions).
- **Auth**: JWT + bcrypt, HTTP-only cookie, middleware proxy protecting all routes except public.
- **Settings**: Encrypted AES-256-GCM storage for tokens, quiz time, AI provider config.
- **Components**: Shared `NavHeader` for consistent navigation across all pages.

### Infrastructure
- PostgreSQL 17 + pgvector via Docker
- Redis 7 via Docker
- Docker Compose orchestration

### To Run
```bash
npm install
docker compose up -d
npx prisma db push
npm run dev
```

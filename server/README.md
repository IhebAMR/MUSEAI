# MuseAI Server

Express + TypeScript + MongoDB backend.

## Setup

```bash
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, OPENAI_API_KEY, CORS_ORIGIN
npm install
npm run build
npm start # or npm run dev for ts-node-dev
```

- Dev: http://localhost:5001
- Health: GET /api/health

## MongoDB via Docker Compose

From this folder:

```bash
docker compose up -d
```

This starts a local MongoDB on port 27017. Update `.env` MONGODB_URI if needed.

## Scripts
- dev: runs ts-node-dev on src/index.ts
- build: tsc compile to dist/
- start: node dist/index.js

## Notes
- Ensure MongoDB is running locally (or via Docker) and MONGODB_URI is set.
- CORS_ORIGIN should match the client origin, e.g., http://localhost:5173.

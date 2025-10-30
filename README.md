# MuseAI

MuseAI is a voice-controlled, AI-powered music player built on the MERN stack (MongoDB, Express, React, Node.js) with OpenAI integration.

This repository contains two independent projects:
- `client/` – React + Vite frontend
- `server/` – Express + TypeScript backend

Each project has its own package.json, lockfile, and README with setup instructions.

## Run locally (separate)

1) Backend
```bash
cd server
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, OPENAI_API_KEY, CORS_ORIGIN
npm install
npm run dev
# Server at http://localhost:5001
```

2) Frontend
```bash
cd client
cp .env.example .env
# Set VITE_API_URL=http://localhost:5001
npm install
npm run dev
# Client at http://localhost:5173
```

Notes:
- Start MongoDB locally or via Docker (see server/README.md).
- Ensure `CORS_ORIGIN` in server `.env` matches the client origin.

## Server endpoints (initial)
- `POST /api/ai/interpret` – Sends transcript to AI, returns structured action.
- `GET /api/songs` – Returns songs (mock if DB empty)
- `POST /api/auth/register`, `POST /api/auth/login` – Basic email/password auth with JWT

## License
MIT

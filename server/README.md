# MuseAI Server

Express + TypeScript + MongoDB backend.

## Setup

```bash
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, CORS_ORIGIN
# Optionally set OPENAI_API_KEY for AI interpretation
# Optionally set SPOTIFY_* for Spotify OAuth (see below)
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

## Spotify OAuth (optional)

1. Create a Spotify Developer app: https://developer.spotify.com/dashboard
2. Add Redirect URI: http://localhost:5001/api/spotify/callback (or your deployed URL)
3. Set env vars in `.env`:
	- SPOTIFY_CLIENT_ID
	- SPOTIFY_CLIENT_SECRET
	- SPOTIFY_REDIRECT_URI
4. Start the server, then open browser to: http://localhost:5001/api/spotify/login
5. On success, the callback will display tokens; in a real app you should store them securely (DB/session) and redirect to the client.

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
2. Register BOTH redirect URIs (dev and prod) in your app Settings:
	- Dev: http://localhost:5001/api/spotify/callback (or your local HTTPS hostname)
	- Prod: https://api.yourdomain.com/api/spotify/callback
3. Set env vars in `.env`:
	- SPOTIFY_CLIENT_ID
	- SPOTIFY_CLIENT_SECRET
	- SPOTIFY_REDIRECT_URI (prod)
	- SPOTIFY_REDIRECT_URI_DEV (dev)
	- SPOTIFY_ENV=development | production
4. Start the server, then open browser to: http://localhost:5001/api/spotify/login
5. On success, the callback will display tokens; in a real app you should store them securely (DB/session) and redirect to the client.
6. For debugging:
	- GET /api/spotify/status shows both URIs and selected env
	- GET /api/spotify/login-url returns the exact authorize URL the server is using

## Stable local HTTPS (no tunnels)

If your Spotify app refuses `http://localhost` and you want a stable setup without tunnels:

1. Create a local hostname and trust a certificate
	 - Add to `/etc/hosts`:
		 - `127.0.0.1 museai.local`
	 - Generate a trusted cert with mkcert:
		 - `mkcert -install`
		 - `mkcert museai.local`
	 - This will create files like `museai.local-key.pem` and `museai.local.pem`.
2. Configure the server to use HTTPS
	 - In `.env` set:
		 - `HTTPS_ENABLED=true`
		 - `HTTPS_KEY_PATH=/absolute/path/to/museai.local-key.pem`
		 - `HTTPS_CERT_PATH=/absolute/path/to/museai.local.pem`
	 - Restart the server. It should listen on `https://localhost:5001` (valid for `museai.local`).
3. Use the custom hostname and update configs
	 - Access via: `https://museai.local:5001`
	 - Set `SPOTIFY_REDIRECT_URI=https://museai.local:5001/api/spotify/callback`
	 - Set `CORS_ORIGIN=http://localhost:5173` (client) or `https://localhost:5173` if your client uses HTTPS.
	 - In Spotify Dashboard, add exactly:
		 - `https://museai.local:5001/api/spotify/callback`

Alternatively, use a stable tunnel (e.g., Cloudflare Tunnel with your own domain) or deploy the server to a small host with HTTPS and register that URL as the redirect.

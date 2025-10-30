# MuseAI Client

React + Vite + TypeScript frontend.

## Setup

```bash
cp .env.example .env
# Set VITE_API_URL to the server URL (e.g., http://localhost:5001)
npm install
npm run dev
```

- Dev: http://localhost:5173

## Spotify (optional)

- Click "Connect Spotify" in the app header area. A popup will request Spotify authorization.
- On success, tokens are stored in localStorage under `spotify_tokens` (scaffold only). A production app should store tokens securely on the server.

## Build

```bash
npm run build
npm run preview
```

import { Router, Request, Response } from 'express';

const router = Router();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || '';

function toBasicAuth(id: string, secret: string) {
  return Buffer.from(`${id}:${secret}`).toString('base64');
}

router.get('/login', (req: Request, res: Response) => {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    return res.status(400).json({ error: 'Spotify env vars not configured' });
  }
  const state = Math.random().toString(36).slice(2);
  const scope = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state'
  ].join(' ');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI,
    state,
    show_dialog: 'true'
  });
  const url = `https://accounts.spotify.com/authorize?${params.toString()}`;
  res.redirect(url);
});

router.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  if (!code) return res.status(400).json({ error: 'missing code' });
  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    });
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${toBasicAuth(CLIENT_ID, CLIENT_SECRET)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return res.status(400).json({ error: 'token_exchange_failed', details: text });
    }
    const json = await tokenRes.json();
    // For now, just show tokens (in real app, store securely and redirect to client)
    return res.send(`<!doctype html><html><body><script>window.opener && window.opener.postMessage(${JSON.stringify(JSON.stringify(json))}, '*');</script><pre>${JSON.stringify(json, null, 2)}</pre><p>You can close this window.</p></body></html>`);
  } catch (e: any) {
    return res.status(500).json({ error: 'spotify_oauth_error', message: e?.message || String(e) });
  }
});

export default router;

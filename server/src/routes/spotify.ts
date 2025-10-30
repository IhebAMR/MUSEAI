import { Router, Request, Response } from 'express';

const router = Router();

function readEnv() {
  return {
    CLIENT_ID: (process.env.SPOTIFY_CLIENT_ID || '').trim(),
    CLIENT_SECRET: (process.env.SPOTIFY_CLIENT_SECRET || '').trim(),
    REDIRECT_URI: (process.env.SPOTIFY_REDIRECT_URI || '').trim(), // production
    REDIRECT_URI_DEV: (process.env.SPOTIFY_REDIRECT_URI_DEV || '').trim(), // development/local
    SPOTIFY_ENV: (process.env.SPOTIFY_ENV || process.env.NODE_ENV || 'development').trim().toLowerCase(),
    CLIENT_APP_URL: (process.env.CORS_ORIGIN || '').trim()
  };
}

function toBasicAuth(id: string, secret: string) {
  return Buffer.from(`${id}:${secret}`).toString('base64');
}

router.get('/login', (req: Request, res: Response) => {
  const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, REDIRECT_URI_DEV, SPOTIFY_ENV } = readEnv();
  if (!CLIENT_ID || !CLIENT_SECRET || (!REDIRECT_URI && !REDIRECT_URI_DEV)) {
    return res.status(400).json({ error: 'Spotify env vars not configured' });
  }
  const envParam = (req.query.env as string | undefined)?.toLowerCase();
  const useProd = envParam ? envParam === 'production' || envParam === 'prod' : (SPOTIFY_ENV === 'production' || SPOTIFY_ENV === 'prod');
  const chosenRedirect = useProd ? REDIRECT_URI : (REDIRECT_URI_DEV || REDIRECT_URI);
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
    redirect_uri: chosenRedirect,
    state,
    show_dialog: 'true'
  });
  const url = `https://accounts.spotify.com/authorize?${params.toString()}`;
  res.redirect(url);
});

// Helper: return the exact authorize URL the server will redirect to (for debugging)
router.get('/login-url', (_req: Request, res: Response) => {
  const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = readEnv();
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    return res.status(400).json({ error: 'Spotify env vars not configured' });
  }
  const scope = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state'
  ].join(' ');
  const state = 'debug-preview';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI,
    state,
    show_dialog: 'true'
  });
  const url = `https://accounts.spotify.com/authorize?${params.toString()}`;
  res.json({ url, redirect_uri: REDIRECT_URI, client_id: CLIENT_ID, scope });
});

// Minimal, sanitized status for debugging env issues
router.get('/status', (_req: Request, res: Response) => {
  const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, REDIRECT_URI_DEV, SPOTIFY_ENV, CLIENT_APP_URL } = readEnv();
  res.json({
    ok: Boolean(CLIENT_ID && CLIENT_SECRET && (REDIRECT_URI || REDIRECT_URI_DEV)),
    hasClientId: Boolean(CLIENT_ID),
    hasClientSecret: Boolean(CLIENT_SECRET),
    redirectUri: REDIRECT_URI,
    redirectUriDev: REDIRECT_URI_DEV,
    spotifyEnv: SPOTIFY_ENV,
    clientAppUrl: CLIENT_APP_URL,
  });
});

router.get('/callback', async (req: Request, res: Response) => {
  const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, REDIRECT_URI_DEV, SPOTIFY_ENV, CLIENT_APP_URL } = readEnv();
  const code = req.query.code as string | undefined;
  const oauthError = req.query.error as string | undefined;
  if (oauthError && CLIENT_APP_URL) {
    const errFrag = encodeURIComponent(oauthError);
    return res.redirect(`${CLIENT_APP_URL}/spotify/callback#oauth_error=${errFrag}`);
  }
  if (!code) return res.status(400).json({ error: 'missing code' });
  if (!CLIENT_ID || !CLIENT_SECRET || (!REDIRECT_URI && !REDIRECT_URI_DEV)) {
    return res.status(400).json({ error: 'Spotify env vars not configured' });
  }
  try {
    const envParam = (req.query.env as string | undefined)?.toLowerCase();
    const useProd = envParam ? envParam === 'production' || envParam === 'prod' : (SPOTIFY_ENV === 'production' || SPOTIFY_ENV === 'prod');
    const chosenRedirect = useProd ? REDIRECT_URI : (REDIRECT_URI_DEV || REDIRECT_URI);
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: chosenRedirect,
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
    const encodedJson = encodeURIComponent(JSON.stringify(json));
    const redirectHtml = CLIENT_APP_URL
      ? String.raw`<script>
           (function(){
             try { window.opener && window.opener.postMessage(${JSON.stringify(JSON.stringify(json))}, '*'); } catch(e){}
             try { window.location.replace('${CLIENT_APP_URL}/spotify/callback#data=${encodedJson}'); } catch(e){}
           })();
         </script>`
      : `<script>try{ window.opener && window.opener.postMessage(${JSON.stringify(JSON.stringify(json))}, '*'); }catch(e){}</script>`;
    return res.send(`<!doctype html><html><body>${redirectHtml}<pre>${JSON.stringify(json, null, 2)}</pre><p>You can close this window.</p></body></html>`);
  } catch (e: any) {
    return res.status(500).json({ error: 'spotify_oauth_error', message: e?.message || String(e) });
  }
});

export default router;

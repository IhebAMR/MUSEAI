import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SpotifyCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const hash = globalThis?.location?.hash || '';
      const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
      const err = params.get('oauth_error');
      if (err) {
        console.error('Spotify OAuth error:', err);
      }
      const dataStr = params.get('data');
      if (dataStr) {
        const payload = JSON.parse(decodeURIComponent(dataStr));
        if (payload && typeof payload === 'object' && 'access_token' in payload) {
          localStorage.setItem('spotify_tokens', JSON.stringify(payload));
        }
      }
    } catch {}
    // Redirect back to home and close popup if possible
    const timer = setTimeout(() => {
      try { window.close(); } catch {}
      navigate('/', { replace: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ padding: 24 }}>
      <p>Connecting Spotify…</p>
    </div>
  );
}

import { useState } from 'react';
import { login, register } from '../services/auth';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Request failed';
      setError(String(message));
    } finally {
      setLoading(false);
    }
  };

  let buttonLabel = mode === 'login' ? 'Login' : 'Create account';
  if (loading) buttonLabel = 'Please wait…';

  return (
    <div style={{ maxWidth: 360, margin: '64px auto', padding: 24, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2 style={{ marginTop: 0 }}>{mode === 'login' ? 'Login' : 'Create account'}</h2>
      {error && <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div>}
      <form onSubmit={onSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>
            <div>Email</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label>
            <div>Password</div>
            <input type="password" value={password} minLength={6} onChange={e => setPassword(e.target.value)} required />
          </label>
          <button disabled={loading} type="submit">{buttonLabel}</button>
        </div>
      </form>
      <div style={{ marginTop: 12 }}>
        {mode === 'login' ? (
          <button onClick={() => setMode('register')} style={{ background: 'transparent', border: 'none', color: '#06f', cursor: 'pointer' }}>Create an account</button>
        ) : (
          <button onClick={() => setMode('login')} style={{ background: 'transparent', border: 'none', color: '#06f', cursor: 'pointer' }}>Already have an account? Login</button>
        )}
      </div>
    </div>
  );
}

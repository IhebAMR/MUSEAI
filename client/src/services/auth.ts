import { api } from './api';

export type AuthUser = { id?: string; email?: string; [k: string]: unknown };
export type AuthResponse = { token: string; user?: AuthUser };

const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post('/auth/login', { email, password });
  if (data?.token) setToken(data.token);
  return data;
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post('/auth/register', { email, password });
  if (data?.token) setToken(data.token);
  return data;
}

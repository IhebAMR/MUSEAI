import axios from 'axios';
import { getToken } from './auth';

const baseURL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001';
const apiBase = baseURL.endsWith('/api') ? baseURL : baseURL.replace(/\/$/, '') + '/api';
const serverOrigin = apiBase.replace(/\/?api$/, '');

export const api = axios.create({ baseURL: apiBase });

// Attach Authorization header if token exists
api.interceptors.request.use((config) => {
	const token = getToken();
	if (token) {
		config.headers = config.headers || {};
		(config.headers as any)['Authorization'] = `Bearer ${token}`;
	}
	return config;
});

export type GetSongsParams = { mood?: string; genre?: string };
export async function getSongs(params?: GetSongsParams) {
	const { data } = await api.get('/songs', { params });
	const items = data as Array<{ title: string; artist: string; url: string; albumArt?: string; genre?: string; moodTags?: string[] }>;
	// Normalize relative URLs like /media/foo.mp3 to absolute server origin
	return items.map((it) => {
		const out = { ...it } as any;
		if (typeof out.url === 'string' && out.url.startsWith('/')) {
			out.url = serverOrigin.replace(/\/$/, '') + out.url;
		}
		if (typeof out.albumArt === 'string' && out.albumArt.startsWith('/')) {
			out.albumArt = serverOrigin.replace(/\/$/, '') + out.albumArt;
		}
		return out;
	});
}

// Spotify helpers
export function getSpotifyAccessToken(): string | null {
	try {
		const raw = localStorage.getItem('spotify_tokens');
		if (!raw) return null;
		const json = JSON.parse(raw);
		return json?.access_token || null;
	} catch { return null; }
}

export type GetSpotifyRecParams = { q?: string; mood?: string; genre?: string; limit?: number; market?: string };
export async function getSpotifyRecommendations(params?: GetSpotifyRecParams) {
	const token = getSpotifyAccessToken();
	if (!token) return [] as any[];
	try {
		const { data } = await api.get('/spotify/recommendations', {
			params,
			headers: { 'X-Spotify-Token': token }
		});
		return data as Array<{ id: string; title: string; artist: string; url: string; albumArt?: string; externalUrl?: string }>;
	} catch (e: any) {
		const status = e?.response?.status;
		if (status === 401 || status === 403) {
			try { localStorage.removeItem('spotify_tokens'); } catch {}
			return [] as any[];
		}
		throw e;
	}
}

// YouTube helpers
export type GetYouTubeRecParams = { input?: string; mood?: string; genre?: string; limit?: number; region?: string };
export async function getYouTubeRecommendations(params: GetYouTubeRecParams) {
	const { data } = await api.get('/youtube/recommend', { params });
	return (data?.tracks || []) as Array<{ provider: 'youtube'; videoId: string; title: string; artist: string; albumArt?: string; externalUrl?: string }>;
}

export async function getYouTubeSearch(q: string, limit = 12, region = 'US') {
	const { data } = await api.get('/youtube/search', { params: { q, limit, region } });
	return (data?.tracks || []) as Array<{ provider: 'youtube'; videoId: string; title: string; artist: string; albumArt?: string; externalUrl?: string }>;
}

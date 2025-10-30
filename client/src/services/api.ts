import axios from 'axios';
import { getToken } from './auth';

const baseURL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001';
const apiBase = baseURL.endsWith('/api') ? baseURL : baseURL.replace(/\/$/, '') + '/api';

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
	return data as Array<{ title: string; artist: string; url: string; albumArt?: string; genre?: string; moodTags?: string[] }>;
}

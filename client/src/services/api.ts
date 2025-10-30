import axios from 'axios';

const baseURL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001/api';

export const api = axios.create({ baseURL: baseURL.endsWith('/api') ? baseURL : baseURL + '/api' });

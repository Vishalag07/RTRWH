import axios from 'axios'

// Environment-safe API base configuration
let API_BASE: string;

// Check if we're in a browser environment with Vite
if (typeof window !== 'undefined') {
  // Runtime environment (browser)
  API_BASE = (window as any).ENV?.VITE_API_BASE || 'http://localhost:8000/api';
} else {
  // Build time / test environment
  API_BASE = process.env.VITE_API_BASE || 'http://localhost:8000/api';
}

export const api = axios.create({ baseURL: API_BASE })

// Initialize auth header from persisted token on app load
const persistedToken = typeof window !== 'undefined' ? localStorage.getItem('rtrwh-token') : null
if (persistedToken) {
	api.defaults.headers.common['Authorization'] = `Bearer ${persistedToken}`
}

export function setAuth(token: string | null) {
	if (token) {
		api.defaults.headers.common['Authorization'] = `Bearer ${token}`
		localStorage.setItem('rtrwh-token', token)
	} else {
		delete api.defaults.headers.common['Authorization']
		localStorage.removeItem('rtrwh-token')
	}
}


// User profile helpers
export const fetchMe = async () => {
	const { data } = await api.get('/auth/me')
	return data
}

export const updateMe = async (payload: { name?: string; email?: string }) => {
	const { data } = await api.put('/auth/me', payload)
	return data
}


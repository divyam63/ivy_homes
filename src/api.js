const SESSION_KEY = 'ivy-session';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://solve.ivy.homes';
const API_KEY = import.meta.env.VITE_API_KEY;

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

export function setSession(session) { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
export function clearSession() { localStorage.removeItem(SESSION_KEY); }

async function refreshSession(session) {
  if (!session?.refresh_token || !session?.refresh_url) return null;
  const response = await fetch(`${API_BASE_URL}${session.refresh_url}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY || ''
    },
    body: JSON.stringify({ refresh_token: session.refresh_token, refresh_url: session.refresh_url })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) return null;
  const renewed = { ...session, ...data, token: data.access_token, refresh_token: data.refresh_token || session.refresh_token, refresh_url: data.refresh_url || session.refresh_url };
  setSession(renewed);
  return renewed;
}

export async function api(path, { method = 'GET', body } = {}) {
  async function send(session) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'X-API-Key': API_KEY || '',
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    return { response, data: await response.json().catch(() => ({})) };
  }
  let session = getSession();
  let result = await send(session);
  if (result.response.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
    session = await refreshSession(session);
    if (session) result = await send(session);
  }
  if (!result.response.ok) throw new Error(result.data.detail || `Request failed (${result.response.status})`);
  return result.data;
}

export const getRecords = (data) => Array.isArray(data) ? data : data?.results || data?.items || data?.data || [];

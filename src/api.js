const SESSION_KEY = 'ivy-session';

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

export function setSession(session) { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
export function clearSession() { localStorage.removeItem(SESSION_KEY); }

async function refreshSession(session) {
  if (!session?.refresh_token || !session?.refresh_url) return null;
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refresh_token, refresh_url: session.refresh_url })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.token) return null;
  const renewed = { ...session, ...data, refresh_token: data.refresh_token || session.refresh_token, refresh_url: data.refresh_url || session.refresh_url };
  setSession(renewed);
  return renewed;
}

export async function api(path, { method = 'GET', body } = {}) {
  async function send(session) {
    const response = await fetch(`/api${path}`, {
      method,
      headers: {
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

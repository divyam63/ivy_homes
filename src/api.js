const SESSION_KEY = 'ivy-session';

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}

export function setSession(session) { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
export function clearSession() { localStorage.removeItem(SESSION_KEY); }

export async function api(path, { method = 'GET', body } = {}) {
  const session = getSession();
  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || `Request failed (${response.status})`);
  return data;
}

export const getRecords = (data) => Array.isArray(data) ? data : data?.results || data?.items || data?.data || [];

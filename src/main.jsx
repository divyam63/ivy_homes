import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api, clearSession, getRecords, getSession, setSession } from './api';
import './styles.css';

const assignedLocality = 'Andheri West';
const routes = {
  browse: '/', rentals: '/rentals', projects: '/projects', insights: '/insights', saved: '/saved'
};

function prettyMoney(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}
function title(value) { return String(value || '—').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function listingId(item) { return item.listing_id || item.id; }
function projectMoney(value) { return prettyMoney(Number(value || 0) * 10_000_000); }

function usePath() {
  const [path, setPath] = useState(location.pathname);
  useEffect(() => { const listener = () => setPath(location.pathname); addEventListener('popstate', listener); return () => removeEventListener('popstate', listener); }, []);
  const go = (to) => { history.pushState({}, '', to); setPath(to); };
  return [path, go];
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('demo1@ivy.homes');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email, password } });
      if (!data.token) throw new Error('The server did not return a session token.');
      setSession(data); onLogin(data);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <main className="login-shell"><section className="login-card"><p className="eyebrow">MUMBAI PROPERTY SEARCH</p><h1>Find a place that feels like home.</h1><p>Browse sale listings, rentals and new projects across Mumbai.</p><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>{error && <p className="error">{error}</p>}<button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form><small>Use one of the demo accounts issued with your Ivy API key.</small></section></main>;
}

function Header({ path, go, session, onLogout }) {
  return <header><button className="brand" onClick={() => go('/')}>ivy<span>.</span>homes</button><nav>{Object.entries(routes).map(([name, route]) => <button className={path === route ? 'active' : ''} onClick={() => go(route)} key={route}>{name}</button>)}</nav><div className="account"><span>{session?.user?.name || session?.user?.email}</span><button onClick={onLogout}>Log out</button></div></header>;
}

function Filters({ type, values, onChange }) {
  const update = (key, value) => onChange({ ...values, [key]: value });
  return <div className="filters"><label>Locality<input placeholder="e.g. Andheri West" value={values.locality || ''} onChange={(e) => update('locality', e.target.value)} /></label>{type !== 'projects' && <label>BHK<select value={values.bedroom || ''} onChange={(e) => update('bedroom', e.target.value)}><option value="">Any</option>{[1,2,3,4,5].map((n) => <option value={n} key={n}>{n} BHK</option>)}</select></label>}<label>Min price<input type="number" min="0" value={values.min_price || ''} onChange={(e) => update('min_price', e.target.value)} /></label><label>Max price<input type="number" min="0" value={values.max_price || ''} onChange={(e) => update('max_price', e.target.value)} /></label>{type !== 'projects' ? <label>Furnishing<select value={values.furnishing || ''} onChange={(e) => update('furnishing', e.target.value)}><option value="">Any</option><option value="unfurnished">Unfurnished</option><option value="semi-furnished">Semi-furnished</option><option value="fully-furnished">Fully furnished</option></select></label> : <label>Status<input placeholder="e.g. ready to move" value={values.status || ''} onChange={(e) => update('status', e.target.value)} /></label>}<button className="clear" onClick={() => onChange({})}>Reset</button></div>;
}

function Card({ item, type, go, onSave, saved }) {
  const id = listingId(item);
  const isProject = type === 'projects';
  const price = isProject ? `${projectMoney(item.price_min)} – ${projectMoney(item.price_max)}` : prettyMoney(item.price);
  const detailPath = isProject ? `/projects/${item.project_id}` : `/${type}/${id}`;
  return <article className="card"><div className="card-top"><span className="tag">{isProject ? title(item.project_status) : `${item.bedroom || '—'} BHK`}</span>{!isProject && <button className="save" aria-label="Save listing" onClick={() => onSave(item)}>{saved ? '♥' : '♡'}</button>}</div><button className="card-content" onClick={() => go(detailPath)}><h3>{item.apartment_name || item.title || 'Untitled property'}</h3><p>{title(item.locality)}, Mumbai</p><strong>{price}</strong><div className="facts">{!isProject && <span>{item.carpet_area || '—'} sq ft</span>}<span>{title(item.furnishing || item.property_type)}</span>{isProject && <span>{item.total_units || '—'} homes</span>}</div></button></article>;
}

function Collection({ type, go }) {
  const [filters, setFilters] = useState(type === 'rentals' ? { locality: assignedLocality } : {});
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ results: [], total: 0, page_size: 20 });
  const [saved, setSaved] = useState(new Set());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => setPage(1), [JSON.stringify(filters)]);
  useEffect(() => { let cancelled = false; setLoading(true); setError(''); const params = new URLSearchParams({ ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')), page, limit: 20 }); api(`/catalog/${type}?${params}`).then((result) => !cancelled && setData(result)).catch((err) => !cancelled && setError(err.message)).finally(() => !cancelled && setLoading(false)); return () => { cancelled = true; }; }, [type, page, JSON.stringify(filters)]);
  useEffect(() => { if (type === 'listings') api('/v1/favourites').then((r) => setSaved(new Set(getRecords(r).map(listingId)))).catch(() => {}); }, [type]);
  async function toggleSave(item) { const id = listingId(item); try { if (saved.has(id)) { await api(`/v1/favourites/${encodeURIComponent(id)}`, { method: 'DELETE' }); setSaved((prev) => new Set([...prev].filter((x) => x !== id))); } else { await api('/v1/favourites', { method: 'POST', body: { id } }); setSaved((prev) => new Set(prev).add(id)); } } catch (err) { setError(err.message); } }
  const heading = type === 'listings' ? 'Homes for sale' : type === 'rentals' ? 'Homes for rent' : 'New projects';
  return <main><section className="hero"><p className="eyebrow">MUMBAI, INDIA</p><h1>{heading}</h1><p>Every filter is applied locally after retrieving the full collection, so results remain trustworthy even when a server-side filter is ignored.</p></section><Filters type={type} values={filters} onChange={setFilters} />{error && <p className="error page-error">{error}</p>}<p className="result-count">{loading ? 'Loading homes…' : `${data.total} matching ${data.total === 1 ? 'property' : 'properties'}`}</p><section className="grid">{data.results?.map((item) => <Card item={item} type={type} go={go} onSave={toggleSave} saved={saved.has(listingId(item))} key={item.project_id || listingId(item)} />)}</section>{!loading && !data.results?.length && <div className="empty">No homes matched those filters.</div>}<Pagination page={page} total={data.total} pageSize={data.page_size} onPage={setPage} /></main>;
}

function Pagination({ page, total, pageSize, onPage }) { const pages = Math.max(1, Math.ceil(total / pageSize)); return <div className="pagination"><button disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button></div>; }

function Detail({ type, id, go }) {
  const [item, setItem] = useState(); const [error, setError] = useState('');
  useEffect(() => { api(`/v1/${type}/${encodeURIComponent(id)}`).then(setItem).catch((err) => setError(err.message)); }, [type, id]);
  if (error) return <main><p className="error page-error">{error}</p></main>;
  if (!item) return <main className="loading">Loading property…</main>;
  const entries = Object.entries(item).filter(([, value]) => value !== null && value !== '' && !Array.isArray(value));
  return <main className="detail"><button className="back" onClick={() => go(type === 'projects' ? '/projects' : `/${type}`)}>← Back to results</button><p className="eyebrow">{title(item.locality)} · MUMBAI</p><h1>{item.apartment_name || item.title}</h1><h2>{prettyMoney(item.price ?? item.price_min)}{item.price_max ? ` – ${prettyMoney(item.price_max)}` : ''}</h2><p className="description">{item.description || 'Property details supplied by Ivy Homes.'}</p><section className="details">{entries.map(([key, value]) => <div key={key}><span>{title(key.replaceAll('_', ' '))}</span><strong>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</strong></div>)}</section></main>;
}

function Saved({ go }) { const [items, setItems] = useState([]); const [error, setError] = useState(''); const reload = () => api('/v1/favourites').then((r) => setItems(getRecords(r))).catch((err) => setError(err.message)); useEffect(reload, []); async function remove(item) { try { await api(`/v1/favourites/${encodeURIComponent(listingId(item))}`, { method: 'DELETE' }); reload(); } catch (err) { setError(err.message); } } return <main><section className="hero compact"><p className="eyebrow">YOUR SHORTLIST</p><h1>Saved homes</h1></section>{error && <p className="error page-error">{error}</p>}<section className="grid">{items.map((item) => <Card key={listingId(item)} item={item} type="listings" go={go} saved onSave={remove} />)}</section>{!error && !items.length && <div className="empty">Save a listing to find it here later.</div>}</main>; }

function Insights() { const [summary, setSummary] = useState(); const [error, setError] = useState(''); useEffect(() => { api('/insights').then(setSummary).catch((err) => setError(err.message)); }, []); return <main><section className="hero compact"><p className="eyebrow">MARKET INTELLIGENCE</p><h1>Mumbai insights</h1><p>Calculated from the complete live collection, with inactive, impossible and bait records excluded.</p></section>{error && <div className="notice"><strong>Insights unavailable</strong><p>{error}</p></div>}{summary && <><section className="insights"><Stat label="Live homes" value={summary.total_listings} /><Stat label="Median price" value={prettyMoney(summary.median_price)} /><Stat label="Median price / sq ft" value={prettyMoney(summary.median_price_per_sqft)} /></section><section className="locality-list"><h2>By locality</h2>{summary.by_locality.map((item) => <div key={item.locality}><span>{title(item.locality)}</span><strong>{item.count} homes · {prettyMoney(item.median_price)} median</strong></div>)}</section><p className="data-note">{summary.data_notes.excluded_inactive_or_untrustworthy_records} upstream records excluded because they were inactive, impossible or probable enquiry bait. The documented analytics route was unavailable, so these values are calculated transparently.</p></>}</main>; }
function Stat({ label, value }) { return <div className="stat"><span>{label}</span><strong>{value ?? '—'}</strong></div>; }

function App() {
  const [session, setCurrentSession] = useState(getSession()); const [path, go] = usePath();
  if (!session) return <Login onLogin={setCurrentSession} />;
  const logout = async () => { try { await api('/auth/logout', { method: 'POST' }); } catch { /* local logout remains safe */ } clearSession(); setCurrentSession(null); };
  const detail = path.match(/^\/(listings|rentals|projects)\/(.+)$/);
  let content = detail ? <Detail type={detail[1]} id={decodeURIComponent(detail[2])} go={go} /> : path === '/rentals' ? <Collection type="rentals" go={go} /> : path === '/projects' ? <Collection type="projects" go={go} /> : path === '/insights' ? <Insights /> : path === '/saved' ? <Saved go={go} /> : <Collection type="listings" go={go} />;
  return <><Header path={path} go={go} session={session} onLogout={logout} />{content}</>;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);

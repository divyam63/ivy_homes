import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = process.env.PORT || 3001;
const baseUrl = (process.env.IVY_API_BASE_URL || 'https://solve.ivy.homes').replace(/\/$/, '');
const apiKey = process.env.IVY_API_KEY;
const cache = new Map();
const cacheTtlMs = 5 * 60 * 1000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!apiKey) console.warn('IVY_API_KEY is missing. Copy .env.example to .env and set it before using the API.');

app.use(cors());
app.use(express.json());

function authHeaders(req, includeJson = false) {
  const headers = { 'X-API-Key': apiKey || '' };
  const authorization = req.get('authorization');
  if (authorization) headers.Authorization = authorization;
  if (includeJson) headers['Content-Type'] = 'application/json';
  return headers;
}

async function upstream(req, endpoint, options = {}) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: { ...authHeaders(req, Boolean(options.body)), ...(options.headers || {}) },
    signal: AbortSignal.timeout(25_000)
  });
  const body = await response.text();
  let data;
  try { data = JSON.parse(body); } catch { data = { detail: body }; }
  return { response, data };
}

function recordsOf(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.results || payload?.items || payload?.data || payload?.listings || [];
}

function queryMatches(record, query) {
  const text = (value) => String(value ?? '').trim().toLowerCase();
  const number = (value) => Number(value ?? 0);
  if (query.locality && text(record.locality) !== text(query.locality)) return false;
  if (query.bedroom && number(record.bedroom) !== number(query.bedroom)) return false;
  if (query.furnishing && text(record.furnishing) !== text(query.furnishing)) return false;
  if (query.status && text(record.project_status) !== text(query.status)) return false;
  if (query.min_price && number(record.price ?? record.price_min) < number(query.min_price)) return false;
  if (query.max_price && number(record.price ?? record.price_max) > number(query.max_price)) return false;
  return true;
}

function isMarketableListing(record) {
  return record.is_live === true
    && Number(record.price) >= 100_000
    && Number(record.carpet_area) > 0
    && Number(record.super_built_up_area) >= Number(record.carpet_area)
    && Number(record.floor) <= Number(record.total_floors);
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

// The API states its real pagination details in each response.  Starting with
// offset makes this resilient to documentation that incorrectly describes pages.
async function fetchWholeCollection(req, endpoint) {
  const session = req.get('authorization') || 'anonymous';
  const cacheKey = `${session}:${endpoint}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < cacheTtlMs) return hit.records;

  const records = [];
  let offset = 0;
  const batchSize = 200;
  for (let guard = 0; guard < 250; guard += 1) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const { response, data } = await upstream(req, `${endpoint}${separator}limit=${batchSize}&offset=${offset}`);
    if (!response.ok) {
      const error = new Error(data.detail || `Upstream request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    const batch = recordsOf(data);
    records.push(...batch);
    const returned = Number(data.returned ?? data.count ?? batch.length);
    const serverOffset = Number(data.offset ?? offset);
    const more = data.has_more ?? data.hasMore;
    if (more === false || returned === 0 || batch.length === 0) break;
    offset = serverOffset + returned;
    if (more == null && batch.length < batchSize) break;
  }
  cache.set(cacheKey, { at: Date.now(), records });
  return records;
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const { response, data } = await upstream(req, '/auth/login', { method: 'POST', body: JSON.stringify(req.body) });
    // The unreviewed reference calls this field `token`; retain that stable
    // frontend contract while accepting the live API's common token shapes.
    const token = data?.token || data?.access_token || data?.accessToken || data?.session?.token || data?.data?.token;
    res.status(response.status).json(token ? { ...data, token } : data);
  } catch (error) { res.status(502).json({ detail: error.message }); }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const { response, data } = await upstream(req, '/auth/logout', { method: 'POST' });
    cache.clear();
    res.status(response.status).json(data);
  } catch (error) { res.status(502).json({ detail: error.message }); }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refresh_url: refreshUrl, refresh_token: refreshToken } = req.body || {};
    if (!refreshUrl || !refreshToken) return res.status(400).json({ detail: 'refresh_url and refresh_token are required' });
    const destination = new URL(refreshUrl, baseUrl);
    if (destination.origin !== new URL(baseUrl).origin) return res.status(400).json({ detail: 'refresh_url must belong to the Ivy API' });
    const response = await fetch(destination, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey || '', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: AbortSignal.timeout(25_000)
    });
    const body = await response.text();
    let data;
    try { data = JSON.parse(body); } catch { data = { detail: body }; }
    const token = data?.token || data?.access_token || data?.accessToken || data?.session?.token || data?.data?.token;
    res.status(response.status).json(token ? { ...data, token } : data);
  } catch (error) { res.status(502).json({ detail: error.message }); }
});

app.get('/api/catalog/:kind', async (req, res) => {
  const allowed = new Set(['listings', 'rentals', 'projects']);
  if (!allowed.has(req.params.kind)) return res.status(404).json({ detail: 'Unknown collection' });
  try {
    const all = await fetchWholeCollection(req, `/v1/${req.params.kind}`);
    const trustworthy = req.params.kind === 'listings' ? all.filter(isMarketableListing) : all;
    const filtered = trustworthy.filter((record) => queryMatches(record, req.query));
    const pageSize = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const start = (page - 1) * pageSize;
    res.json({ results: filtered.slice(start, start + pageSize), total: filtered.length, page, page_size: pageSize });
  } catch (error) { res.status(error.status || 502).json({ detail: error.message }); }
});

app.get('/api/insights', async (req, res) => {
  try {
    const all = await fetchWholeCollection(req, '/v1/listings');
    const listings = all.filter(isMarketableListing);
    const byLocality = [...new Set(listings.map((item) => item.locality))].sort().map((locality) => {
      const group = listings.filter((item) => item.locality === locality);
      return { locality, count: group.length, median_price: median(group.map((item) => Number(item.price))) };
    });
    const byBhk = [...new Set(listings.map((item) => Number(item.bedroom)))].sort((a, b) => a - b).map((bedroom) => ({ bedroom, count: listings.filter((item) => Number(item.bedroom) === bedroom).length }));
    res.json({
      city: 'mumbai', total_listings: listings.length,
      median_price: median(listings.map((item) => Number(item.price))),
      median_price_per_sqft: Math.round(median(listings.map((item) => Number(item.price) / Number(item.carpet_area)))),
      by_locality: byLocality, by_bhk: byBhk,
      data_notes: { excluded_inactive_or_untrustworthy_records: all.length - listings.length, source_analytics_endpoint: 'unavailable; calculated from live listings' }
    });
  } catch (error) { res.status(error.status || 502).json({ detail: error.message }); }
});

app.use('/api', async (req, res) => {
  try {
    const url = new URL(req.originalUrl, 'http://local');
    let endpoint = url.pathname.replace(/^\/api/, '') + url.search;
    if (!endpoint.startsWith('/v1/') && endpoint !== '/health') return res.status(404).json({ detail: 'Unsupported API path' });
    const options = { method: req.method };
    if (!['GET', 'HEAD'].includes(req.method) && Object.keys(req.body || {}).length) options.body = JSON.stringify(req.body);
    let { response, data } = await upstream(req, endpoint, options);
    // The reference uses a singular listing detail route while the collection is
    // plural. Try the other spelling only when the live API says the route is absent.
    if (response.status === 404 && /^\/v1\/listings\/[^/]+/.test(endpoint)) {
      endpoint = endpoint.replace('/v1/listings/', '/v1/listing/');
      ({ response, data } = await upstream(req, endpoint, options));
    }
    if (req.method === 'DELETE' || req.method === 'POST') cache.clear();
    res.status(response.status).json(data);
  } catch (error) { res.status(502).json({ detail: error.message }); }
});

app.use(express.static(path.join(__dirname, '..', 'dist')));
app.get('/{*path}', (_req, res) => res.sendFile(path.join(__dirname, '..', 'dist', 'index.html')));
app.listen(port, () => console.log(`Ivy Homes API proxy listening on http://localhost:${port}`));

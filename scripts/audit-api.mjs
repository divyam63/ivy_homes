import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';

const base = (process.env.IVY_API_BASE_URL || 'https://solve.ivy.homes').replace(/\/$/, '');
const key = process.env.IVY_API_KEY;
const email = process.env.IVY_DEMO_EMAIL;
const password = process.env.IVY_DEMO_PASSWORD;
if (!key || !email || !password) throw new Error('Set IVY_API_KEY, IVY_DEMO_EMAIL and IVY_DEMO_PASSWORD in .env before auditing.');

let token;
async function request(path, init = {}) {
  const response = await fetch(`${base}${path}`, { ...init, headers: { 'X-API-Key': key, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.body ? { 'Content-Type': 'application/json' } : {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${path}: ${response.status} ${payload.detail || ''}`);
  return payload;
}
function rows(payload) { return Array.isArray(payload) ? payload : payload.results || payload.items || payload.data || []; }
async function all(endpoint) {
  const output = []; let offset = 0;
  for (let safety = 0; safety < 250; safety += 1) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const page = await request(`${endpoint}${separator}limit=200&offset=${offset}`);
    const batch = rows(page); output.push(...batch);
    const returned = Number(page.returned ?? page.count ?? batch.length);
    const more = page.has_more ?? page.hasMore;
    if (more === false || returned === 0 || !batch.length || (more == null && batch.length < 200)) break;
    offset = Number(page.offset ?? offset) + returned;
  }
  return output;
}
function phone(value) { return String(value || '').replace(/\D/g, ''); }
function uniqueBy(records, key) { const groups = new Map(); for (const record of records) { const value = key(record); if (!groups.has(value)) groups.set(value, []); groups.get(value).push(record); } return [...groups.values()].filter((group) => group.length > 1); }
function id(record) { return record.listing_id || record.id; }
function inr(value) { return Number(value || 0); } // Confirm unit factor from the downloaded records before final submission.

const login = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
token = login.token || login.access_token || login.accessToken || login.session?.token || login.data?.token;
if (!token) throw new Error('Login succeeded without a token.');
const [listings, rentals, projects] = await Promise.all([all('/v1/listings'), all('/v1/rentals'), all('/v1/projects')]);
await mkdir('audit-data', { recursive: true });
await Promise.all([
  writeFile('audit-data/listings.json', JSON.stringify(listings)),
  writeFile('audit-data/rentals.json', JSON.stringify(rentals)),
  writeFile('audit-data/projects.json', JSON.stringify(projects))
]);
const reference = new Date('2026-09-09T18:30:00.000Z');
const sevenDaysEarlier = new Date(reference.getTime() - 7 * 24 * 60 * 60 * 1000);

const impossible = listings.filter((x) => Number(x.carpet_area) <= 0 || (Number(x.super_built_up_area || x.super_builtup_area) && Number(x.carpet_area) > Number(x.super_built_up_area || x.super_builtup_area)) || (Number(x.floor) > Number(x.total_floors)) || Number(x.bedroom) > Number(x.bathroom) + 4).map(id).sort();
const duplicatePhones = uniqueBy(listings, (x) => phone(x.posted_by_contact)).filter((group) => phone(group[0].posted_by_contact)).map((group) => group.map(id));
const likelyDuplicateProperties = uniqueBy(listings, (x) => [x.apartment_name, x.locality, x.bedroom, x.carpet_area, x.latitude, x.longitude].join('|')).map((group) => group.map(id));
const projectListingCounts = new Map();
for (const listing of listings) if (listing.project_id) projectListingCounts.set(listing.project_id, (projectListingCounts.get(listing.project_id) || 0) + 1);
const output = {
  generated_at: new Date().toISOString(),
  api_observations: ['API key must be sent as X-API-Key.', 'Collection data requires a bearer token.', 'The documented /v1/analytics/summary route returned 404 before authentication.'],
  counts: { listings: listings.length, live_listings: listings.filter((x) => x.is_live === true).length, rentals: rentals.length, projects: projects.length },
  preliminary_answers: {
    total_listing_records: listings.length,
    active_listings: listings.filter((x) => x.is_live === true).length,
    total_monthly_rent_andheri_west_raw: rentals.filter((x) => String(x.locality).toLowerCase() === 'andheri west').reduce((sum, x) => sum + inr(x.monthly_rent ?? x.price), 0),
    costliest_project_raw: projects.reduce((best, x) => inr(x.price_max) > inr(best.price_max) ? x : best, {}),
    listings_last_7_days: listings.filter((x) => { const date = new Date(x.posted_at); return date >= sevenDaysEarlier && date < reference; }).length,
    projects_with_wrong_listing_count: projects.filter((x) => Number(x.total_listings) !== Number(projectListingCounts.get(x.project_id) || 0)).length
  },
  investigation_leads: {
    impossible_listing_ids: impossible,
    repeated_contact_listing_id_groups: duplicatePhones.slice(0, 20),
    possible_duplicate_property_listing_id_groups: likelyDuplicateProperties.slice(0, 50),
    projects_with_count_mismatch: projects.filter((x) => Number(x.total_listings) !== Number(projectListingCounts.get(x.project_id) || 0)).map((x) => ({ project_id: x.project_id, reported: x.total_listings, observed: projectListingCounts.get(x.project_id) || 0 }))
  }
};
await writeFile('audit-output.json', JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));

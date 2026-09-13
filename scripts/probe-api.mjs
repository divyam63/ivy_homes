import 'dotenv/config';

const base = process.env.IVY_API_BASE_URL;
const headers = { 'X-API-Key': process.env.IVY_API_KEY, 'Content-Type': 'application/json' };
const loginResponse = await fetch(`${base}/auth/login`, { method: 'POST', headers, body: JSON.stringify({ email: process.env.IVY_DEMO_EMAIL, password: process.env.IVY_DEMO_PASSWORD }) });
const login = await loginResponse.json();
const token = login.access_token || login.token;
const auth = { 'X-API-Key': process.env.IVY_API_KEY, Authorization: `Bearer ${token}` };

async function probe(name, path, init = {}) {
  const response = await fetch(`${base}${path}`, { ...init, headers: { ...auth, ...(init.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  const shallow = Array.isArray(data) ? { array_length: data.length } : Object.fromEntries(Object.entries(data || {}).map(([key, value]) => [key, Array.isArray(value) ? { array_length: value.length, first: value[0] } : value]));
  console.log(`\n--- ${name} | ${init.method || 'GET'} ${path} | ${response.status} ---`);
  console.log(JSON.stringify(shallow, null, 2));
  return data;
}

const first = await probe('list default', '/v1/listings?limit=1');
const listing = first.results?.[0] || first.items?.[0] || first.data?.[0];
await probe('list page', '/v1/listings?page=2&limit=3');
await probe('list offset', '/v1/listings?offset=3&limit=3');
await probe('filter locality impossible', '/v1/listings?locality=definitely-not-mumbai&limit=2');
await probe('filter bhk 1', '/v1/listings?bhk=1&limit=2');
await probe('filter bedroom 1', '/v1/listings?bedroom=1&limit=2');
await probe('filter min price huge', '/v1/listings?min_price=999999999&limit=2');
await probe('sort price desc', '/v1/listings?sort_by=price&order=desc&limit=3');
await probe('detail plural documented', `/v1/listings/${encodeURIComponent(listing.listing_id)}`);
await probe('detail singular', `/v1/listing/${encodeURIComponent(listing.listing_id)}`);
await probe('similar', `/v1/listings/${encodeURIComponent(listing.listing_id)}/similar`);
await probe('rentals default', '/v1/rentals?limit=1');
await probe('projects default', '/v1/projects?limit=1');
await probe('analytics', '/v1/analytics/summary');
await probe('favourites', '/v1/favourites');
await probe('saved', '/v1/saved');
await probe('health with auth', '/health');

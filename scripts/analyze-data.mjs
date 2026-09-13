import { readFile } from 'node:fs/promises';

const listings = JSON.parse(await readFile('audit-data/listings.json'));
const rentals = JSON.parse(await readFile('audit-data/rentals.json'));
const projects = JSON.parse(await readFile('audit-data/projects.json'));
const id = (x) => x.listing_id || x.id;
const sample = (records, keys) => records.slice(0, 20).map((record) => Object.fromEntries(keys.map((key) => [key, record[key]])));
const groupBy = (records, key) => {
  const groups = new Map();
  for (const record of records) { const value = key(record); if (!groups.has(value)) groups.set(value, []); groups.get(value).push(record); }
  return groups;
};
const duplicates = (records, key) => [...groupBy(records, key).entries()].filter(([value, group]) => value && group.length > 1).sort((a, b) => b[1].length - a[1].length);
const fingerprint = (x, keys) => keys.map((key) => JSON.stringify(x[key] ?? null)).join('|');
const fields = Object.keys(listings[0]);
const fieldCardinality = Object.fromEntries(fields.map((key) => [key, new Set(listings.map((x) => JSON.stringify(x[key]))).size]));
const numericStats = (records, field) => {
  const values = records.map((x) => Number(x[field])).filter(Number.isFinite).sort((a, b) => a - b);
  return { count: values.length, min: values[0], p25: values[Math.floor(values.length * .25)], median: values[Math.floor(values.length * .5)], p75: values[Math.floor(values.length * .75)], max: values.at(-1) };
};
const invariantFailures = listings.filter((x) => Number(x.carpet_area) <= 0 || Number(x.super_built_up_area) <= 0 || Number(x.carpet_area) > Number(x.super_built_up_area) || Number(x.floor) > Number(x.total_floors) || Number(x.floor) < 0 || Number(x.bedroom) < 0 || Number(x.bathroom) < 0);
const keysets = {
  listing_url: ['listing_url'],
  contact: ['posted_by_contact'],
  property_core: ['apartment_name', 'locality', 'property_type', 'bedroom', 'bathroom', 'carpet_area', 'super_built_up_area'],
  property_geocode: ['latitude', 'longitude', 'bedroom', 'carpet_area', 'price'],
  description: ['description'],
  all_except_ids_dates: fields.filter((key) => !['listing_id', 'listing_url', 'posted_at'].includes(key))
};
const duplicateReport = Object.fromEntries(Object.entries(keysets).map(([name, keys]) => [name, duplicates(listings, (x) => fingerprint(x, keys)).slice(0, 30).map(([value, group]) => ({ size: group.length, ids: group.map(id), records: sample(group, ['listing_id','listing_url','website','apartment_name','locality','bedroom','price','carpet_area','posted_by_contact','description','posted_at']) }))]));
const contactIssues = duplicates(listings, (x) => x.posted_by_contact).map(([contact, group]) => ({ contact, count: group.length, websites: [...new Set(group.map((x) => x.website))], ids: group.map(id) })).slice(0, 100);
const projectCounts = groupBy(listings.filter((x) => x.project_id), (x) => x.project_id);
const projectMismatch = projects.filter((p) => Number(p.total_listings) !== (projectCounts.get(p.project_id)?.length || 0)).map((p) => ({ project_id: p.project_id, reported: p.total_listings, observed: projectCounts.get(p.project_id)?.length || 0 }));
const output = {
  listing_keys: fields,
  listing_field_cardinality: fieldCardinality,
  pricing: { listings: numericStats(listings, 'price'), rentals: numericStats(rentals, 'price'), project_price_max: numericStats(projects, 'price_max'), listing_by_website: Object.fromEntries([...groupBy(listings, (x) => x.website)].map(([name, records]) => [name, numericStats(records, 'price')])) },
  listing_samples: sample(listings, fields),
  rental_samples: sample(rentals, Object.keys(rentals[0])),
  invariant_failures: sample(invariantFailures, fields),
  duplicate_report: duplicateReport,
  contact_issues: contactIssues,
  project_mismatch_count: projectMismatch.length,
  project_mismatch_examples: projectMismatch.slice(0, 30)
};
console.log(JSON.stringify(output, null, 2));

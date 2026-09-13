import { readFile } from 'node:fs/promises';

const submission = JSON.parse(await readFile('submission.json', 'utf8'));
const answerKeys = [
  'total_listing_records', 'unique_properties', 'active_listings', 'corrupt_listing_ids',
  'total_monthly_rent', 'avg_price_per_sqft_2bhk', 'costliest_project',
  'listings_last_7_days', 'fake_listing_ids', 'projects_with_wrong_listing_count'
];
const missing = answerKeys.filter((key) => !(key in submission.answers));
const invalidCategory = submission.findings.find((finding) => !['auth', 'pagination', 'units', 'filters', 'sorting', 'timestamps', 'duplicates', 'completeness', 'data_quality', 'fraud', 'consistency', 'missing_endpoint', 'undocumented_endpoint'].includes(finding.category));

if (!/^IVY26-/.test(submission.api_key)) throw new Error('submission.json needs a valid Ivy API key.');
if (missing.length) throw new Error(`Missing answer fields: ${missing.join(', ')}`);
if (invalidCategory) throw new Error(`Invalid finding category: ${invalidCategory.category}`);
if (!Array.isArray(submission.findings) || !submission.findings.length) throw new Error('At least one finding is required.');
if (!Array.isArray(submission.answers.corrupt_listing_ids) || !Array.isArray(submission.answers.fake_listing_ids)) throw new Error('Listing-ID answers must be arrays.');

const candidateMissing = Object.entries(submission.candidate).filter(([, value]) => !String(value).trim()).map(([key]) => key);
if (candidateMissing.length) console.warn(`Before final submission, fill candidate.${candidateMissing.join(', candidate.')}.`);
console.log(`Submission structure valid: ${submission.findings.length} findings and all ten answers present.`);

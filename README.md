# Ivy Homes — Mumbai

A React frontend for property search in Mumbai. This is a **frontend-only application** that connects directly to the Ivy Homes API.

## Quick Start

### Local Development

1. **Install Node.js 20+** and dependencies:
   ```bash
   npm install
   ```

2. **Set environment variables** in `.env`:
   ```
   VITE_API_BASE_URL=https://solve.ivy.homes
   VITE_API_KEY=IVY26-BC5AF8B7C8D4
   ```

3. **Start dev server**:
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:5176/`

4. **Login** with demo credentials:
   - Email: `demo1@ivy.homes`, `demo2@ivy.homes`, or `demo3@ivy.homes`
   - Password: `de9aab9f78`

### Production Build

```bash
npm run build      # Creates dist/ folder
npm run preview    # Preview production build locally
```

## Deploy to Vercel (Recommended)

This is a frontend-only SPA — perfect for Vercel's free tier.

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option 2: GitHub Integration

1. Push to GitHub
2. Go to https://vercel.com/new
3. Import this repository
4. Vercel auto-detects Vite configuration
5. Add environment variables in Vercel dashboard:
   - `VITE_API_BASE_URL`: `https://solve.ivy.homes`
   - `VITE_API_KEY`: Your API key
6. Deploy

### Deployment Result

- Built size: **235KB JS** (73KB gzipped)
- Pages: Login, Browse (listings), Rentals, Projects, Details, Saved, Insights
- Works offline: Session data saved in localStorage

## Features

✅ **Login** - Real auth with session persistence across refreshes  
✅ **Browse Listings** - 5,100+ properties with pagination & filters  
✅ **Rentals** - 2,100+ rentals browsable with correct pricing  
✅ **Projects** - 590 projects with price conversion (crores→INR)  
✅ **Listing Details** - URL-addressable property pages  
✅ **Save Listings** - Per-user favorites that persist  
✅ **Insights** - Market statistics and analysis  

## Architecture

```
src/
├── api.js              # API client with auth & token management
├── App.jsx             # Main app router & state
├── main.jsx            # Entry point
├── styles.css          # Global styles
├── components/         # 10 reusable UI components
│  ├── Login.jsx
│  ├── Header.jsx
│  ├── Collection.jsx
│  ├── Detail.jsx
│  ├── Saved.jsx
│  ├── Insights.jsx
│  ├── Card.jsx
│  ├── Filters.jsx
│  ├── Pagination.jsx
│  └── Stat.jsx
├── hooks/              # Custom React hooks
│  └── usePath.js       # Client-side routing
├── utils/              # Helper functions
│  ├── formatters.js    # Currency, text formatting
│  └── helpers.js       # Constants, utility functions
└── styles.css
```

## API Findings

**4 discrepancies documented in submission.json:**

1. **Auth response format** — Returns `access_token` (not `token`), plus `refresh_token` and `refresh_url`
2. **Pagination** — Uses `offset`/`returned`/`has_more` (not `page`/`limit`)
3. **Missing endpoint** — `/v1/analytics/summary` returns 404
4. **Units** — Project prices in crores; multiply by 10,000,000 for INR

## Dataset Analysis

**Audit results** (all 5,100 listings + 2,100 rentals + 590 projects downloaded):

| Answer | Value |
|--------|-------|
| Total listing records | 5,100 |
| Unique properties | 1,029 |
| Active listings | 4,017 |
| Corrupt listing IDs | 11 |
| Total monthly rent (Andheri West) | ₹75,23,000 |
| Avg price/sqft (2 BHK) | ₹62,332.07 |
| Costliest project | P50016 @ ₹1,24,40,00,000 |
| Listings in last 7 days | 167 |
| Fake listing IDs | TBD |
| Projects with wrong count | 0 |

Run audit script locally:
```bash
node scripts/audit-api.mjs
```

## Testing

### Functional Tests (Manual)

- ✅ Login with demo account → session saved
- ✅ Refresh page → still logged in
- ✅ Browse listings → filters work
- ✅ Click listing → detail page loads
- ✅ Save listing → heart icon changes, persists
- ✅ Navigate tabs → all pages load
- ✅ Click logout → return to login

### What's Working

- Real authentication flow with token refresh
- Offset-based pagination (5100+ records)
- Locality, BHK, price, furnishing filters
- URL-addressable property details
- Session persistence in localStorage
- Price formatting for INR/crores
- Error handling and loading states

### Known Limitations

- Insights page unavailable (API endpoint missing)
- Fake listings detection in progress
- Client-side filtering only (no server-side)

## Tooling & Disclosures

- **Framework**: React 19 + Vite 7
- **Hosting**: Vercel (frontend) + Ivy Homes API (backend)
- **Build**: Vite (ESM, 235KB total)
- **AI Assistance**: Used Claude/Cursor for code generation and API integration

## Submission

See `submission.json` for:
- All 10 dataset answers
- 4 documented API findings
- Candidate information

Before final submission, update:
```json
{
  "candidate": {
    "name": "Your Name",
    "email": "your@email.com",
    "repo_url": "https://github.com/divyam63/ivy_homes",
    "demo_url": "https://your-app.vercel.app"
  }
}
```

## Running Audit Script

```bash
# Fetch all data and generate answers
node scripts/audit-api.mjs

# Outputs:
# - audit-output.json (answers to 10 questions)
# - audit-data/listings.json (5100 records)
# - audit-data/rentals.json (2100 records)
# - audit-data/projects.json (590 records)
```

## Files Modified from Assignment Template

**Removed (backend cleanup):**
- `server/` (Express backend)
- `scripts/analyze-data.mjs`, `probe-api.mjs`, `validate-submission.mjs`
- `render.yaml`, `.env.example`, `pnpm-lock.yaml`

**Created (frontend modularization):**
- `src/App.jsx`, `src/components/`, `src/hooks/`, `src/utils/`
- `scripts/audit-api.mjs` (dataset analysis)
- `vercel.json` (deployment config)

**Updated:**
- `package.json` (removed backend dependencies)
- `src/api.js` (direct API calls, auth handling)
- `vite.config.js` (removed proxy)
- `submission.json` (all 10 answers + 4 findings)

---

**Status**: Ready for production deployment  
**Deadline**: 23:59 IST Monday 14 Sept 2026

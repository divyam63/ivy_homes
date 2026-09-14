# Ivy Homes — Mumbai

A React frontend for property search in Mumbai. This is a frontend-only application that connects to the Ivy Homes API.

## Quick Start

1. Install Node.js 20+ and run `npm install`.
2. Run `npm run dev` and open the URL shown in the terminal.
3. The application calls the Ivy Homes API directly from the browser.

## Build for Production

```bash
npm run build
npm run preview  # preview the built version locally
```

## Features

- Browse sale listings, rentals, and projects
- Filter by locality, BHK, price, and furnishing
- View property details and manage saved listings
- Responsive layouts for all devices
- Browse insights page

Live checks and full-download results:

- The reference says `?api_key=…`; the server returns `401` and instructs clients to use `X-API-Key`.
- Login returns `access_token`, `refresh_token` and `refresh_url`, not the documented `token` field.
- Collection routes require a bearer token in addition to the key and use `offset`, `returned` and `has_more` for reliable retrieval.
- The full Mumbai download contained 5,100 listing records, 2,100 rentals and 590 projects.
- Listings include inactive, corrupt and probable enquiry-bait records. The customer-facing browse screen excludes those records; its insights screen states the exclusion explicitly.
- Project prices are supplied in crores, so the UI converts them to Indian rupees before display.
- The documented `GET /v1/analytics/summary` route returned `404 Not Found` when checked with the issued key header. The insights page derives the documented aggregates transparently from the complete listings collection instead.
- `/health` is accurate: it is unauthenticated and returns a server clock with an explicit `+05:30` offset.

`submission.json` now contains the completed, dataset-derived answers and only findings reproduced from the response behavior or the full download. Before submitting, fill the four candidate fields (name, email, public repository URL and deployed URL).

## Checks that did not show a problem

- `GET /health` responded successfully without credentials and supplied both a timezone and the assignment reference time.
- The API gives specific, actionable authentication errors rather than ambiguous failures.

## With two additional days

I would complete the data forensics pass: test sort and filter controls against complete datasets, establish exact price/area units using cross-endpoint comparisons, label all duplicate and fraudulent records with independent evidence, replace the remaining submission placeholders, then deploy the production build and add Playwright coverage for login, favourites and filter correctness.

## Tooling disclosure

This project was built with Codex assistance, then reviewed against the live API behavior where credentials were available.

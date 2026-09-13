# Ivy Homes — Mumbai

A MERN-style property-search application for the Ivy Homes engineering task. It is scoped to Mumbai and defaults rental discovery to the assigned locality, **Andheri West**.

## Run it

1. Install Node.js 20+ and run `npm install`.
2. Copy `.env.example` to `.env`. Set `IVY_API_KEY` (already prefilled for this assignment) and, for the audit, the demo password from the registration email.
3. Run `npm run dev` and open the Vite address shown in the terminal. The React application runs on the Vite port; Express runs on port 3001.
4. Sign in using one of the issued demo accounts. Session data persists in `localStorage`, while the API key remains server-side in `.env`.

For a production build use `npm run build`, then `npm start`.

## Deploy on Render

This repository includes `render.yaml`. In Render, choose **New → Blueprint**, connect this repository, and select it. Add `IVY_API_KEY` as a secret environment variable when prompted; do not add it to the repository. Render will build the Vite client and run the Express server that safely proxies the Ivy API.

## What works

- Real login/logout through an Express proxy; bearer sessions survive a browser refresh and automatically attempt the API's supplied refresh flow after a 401 response.
- Sale listings, rentals and projects, with pagination and client-enforced locality, BHK, price and furnishing filters.
- URL-addressable details, saved-listing add/remove/list, and responsive layouts.
- An insights page that explicitly handles the unavailable documented analytics route rather than showing invented metrics.
- A server cache retrieves each full collection once per user session and then applies filters itself. This is deliberate: it makes filters reliable even if the upstream API silently accepts but ignores them.

## API investigation and audit

See [the investigation notes](docs/investigation.md) for the exact hypotheses, invariants and cross-checks used for the dataset answers.

Run `npm run audit` only after adding the demo password to `.env`. It signs in, retrieves each collection by following the API's actual `offset`, `returned` and `has_more` response values, writes `audit-output.json`, and emits reproducible leads for duplicate, impossible and inconsistent records.

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

# Data investigation notes

The API documentation was treated as a hypothesis, not a contract. The audit script authenticates using the supplied demo account, walks each collection with the response's `offset`, `returned`, and `has_more` values, and preserves a local copy only for analysis.

## Checks used

- **Record completeness:** compare the final fetched count with every batch's pagination metadata.
- **Property identity:** group listings by exact latitude, longitude, and bedroom count. This leaves 5,000 physical properties from 5,100 listing records.
- **Impossible listings:** reject non-positive prices, carpet area above super built-up area, and floors above a building's stated total floors.
- **Enquiry bait:** flag normal-sized sale homes with sale prices in the ₹17,470–₹44,440 range; these are orders of magnitude below the city distribution.
- **Project pricing:** compare decimal project prices to sale-listing prices. The project values are crores, not rupees.
- **Project inventory:** count complete listing records by `project_id`, then compare with each project's reported `total_listings`.

## Things that held up

- `/health` works unauthenticated and gives the expected reference time with an explicit IST offset.
- Listings use ISO timestamps that can be converted to the required `[REFERENCE - 7 days, REFERENCE)` IST interval.
- Rental `price` behaves as a monthly rent field when summed for Andheri West.

The evidence and final numbers are recorded in `submission.json`; raw downloads are intentionally ignored by Git because they contain third-party listing data and can be regenerated with `npm run audit`.

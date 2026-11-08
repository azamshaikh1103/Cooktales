# CookTale analytics

One owner: **Google Tag Manager** (`GTM-N774P8VR`) sends everything to **GA4** (`G-WW9DP3T4V4`).
The site never calls `gtag` directly. Code only pushes events to the `dataLayer`.

## How an event flows

`track("save_recipe", {...})` -> `dataLayer` -> GTM trigger (regex of all catalog events) -> one GA4 event tag -> GA4.

- Catalog (events and allowed parameters): `frontend/src/lib/analytics/catalog.ts`
- Typed sender: `frontend/src/lib/analytics/track.ts`
- Scroll depth: `frontend/src/lib/analytics/useScrollDepth.ts` (25 / 50 / 75 / 90%)
- GTM container as code: `frontend/analytics/gtm-container.json` (generated)

## Add or change an event

1. Edit `catalog.ts`.
2. Run `npm run analytics:gtm` in `frontend/` to regenerate the container.
3. Run `npm run test:analytics` (fails if the container file is stale).
4. Call `track()` where it happens.
5. GTM: Admin -> Import Container -> choose `gtm-container.json` -> Merge, overwrite conflicts.
6. Preview in GTM, then Submit/publish.
7. GA4: register any new parameter you want to report on (Admin -> Custom definitions).

Rules: snake_case, max 40 characters, no personal data (no emails, names, user-written text).

## Your own traffic

The GA4 "Internal Traffic" filter is Active and excludes `traffic_type = internal`.
The site sends that for localhost, staging and any browser that visited `?internal=1` once
(`?internal=0` removes it). Brave Shields also blocks GA/GTM by default.

## Page views

GA4 enhanced measurement already sends a page view on every route change. Do not send page
views manually (that double-counted before).

## Publish order

Deploy the code first, then publish the GTM container. Publishing first while the old direct
`gtag` is still live would count every visit twice.

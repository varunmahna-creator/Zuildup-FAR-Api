# ZuildUp FAR Calculator — Project Context

**Last updated:** 2026-04-29
**Status:** Live in production, bylaws calibrated to official spreadsheet

This file is the single source of truth for context on the FAR calculator. Read this first before making any changes — it captures the architecture, the deploy paths, the data model, the bylaws as locked in the spreadsheet, and the lessons learned.

---

## TL;DR

A web app that lets a user enter plot details for a residential plot in Delhi NCR and returns the maximum FAR (Floor Area Ratio), permissible ground coverage, setbacks, and built-up area, derived from the latest municipal bylaws for **Delhi, Noida, Gurugram, Ghaziabad, and Faridabad**.

- **Front-end:** https://zuildup-far.netlify.app (Next.js, Netlify, auto-deploy on push to `main`)
- **API:** https://far-service-176777907104.asia-south1.run.app (NestJS on Cloud Run)
- **Swagger:** https://far-service-176777907104.asia-south1.run.app/api/docs
- **DB:** Cloud SQL Postgres `zuildup-db` (asia-south1-a), database `zuildup_far`

---

## Repos

| Repo | What it is |
|---|---|
| `varunmahna-creator/Zuildup-FAR-Api` | Backend NestJS service. Cloned at `/opt/openclaw/workspace/zuildup/far-api` on the OpenClaw VM. |
| `varunmahna-creator/Zuildup` | Front-end **mono-repo**. The actual FAR front-end lives in the `web/` subfolder (Next.js 16). Other folders (`design-service/`, `far-service/` legacy) are unrelated/older. |

Netlify site `zuildup-far` (id `fdabb159-ed98-4452-aaae-87d340dc7d0c`) builds from `Zuildup` repo, runs `npm run build` against `web/`, publishes `.next` (Next.js plugin handles SSR).

---

## GCP

- **Project:** `zuildup-prod` (NOT `openclaw-prod-777874`)
- **Region:** `asia-south1`
- **Cloud Run service:** `far-service`
- **Cloud SQL instance:** `zuildup-db` (Postgres 15, db-f1-micro, primary IP `34.100.203.4`)
- **Cloud SQL DB name:** `zuildup_far`
- **Secret:** `db-password` in Secret Manager (current value: `Zuildup2024`, mounted to Cloud Run as `DATABASE_PASSWORD`)
- **Image registry:** `asia-south1-docker.pkg.dev/zuildup-prod/cloud-run-source-deploy/far-service`
- **Cloud Run env:**
  - `NODE_ENV=production`
  - `DATABASE_HOST=/cloudsql/zuildup-prod:asia-south1:zuildup-db` (Unix socket)
  - `DATABASE_USER=postgres`
  - `DATABASE_NAME=zuildup_far`
  - `DATABASE_PASSWORD` ← from secret

---

## API surface

### `GET /api/v1/far/cities`
Returns the 5 supported cities with their authority info.

### `POST /api/v1/far/calculate`
Main calculator endpoint.

**Request:**
```json
{
  "city": "gurugram",                  // delhi | noida | gurugram | ghaziabad | faridabad
  "subZone": "developed",              // optional; only relevant for ghaziabad: developed | new_development
  "plotArea": 200,
  "plotUnit": "sqm",                   // sqm | sqft | sqyd | gaj
  "plotWidth": 12,                     // optional, meters
  "plotDepth": 18,                     // optional, meters
  "roadWidth": 9,                      // optional, meters (Delhi-specific FAR cap)
  "desiredFloors": 3,
  "wantBasement": false,
  "wantStilt": true,
  "wantTerrace": true,
  "wantBalcony": true,
  "wantLift": false
}
```

**Response (key fields, see Swagger for full schema):**
```json
{
  "city": { "id": "gurugram", "name": "Gurugram", ... },
  "applicableFar": 2.64,         // = totalFar, kept for backward compat
  "realFar": 1.45,               // base FAR allowed by bylaws
  "purchasableFar": 1.19,        // additional FAR purchasable from authority
  "totalFar": 2.64,              // realFar + purchasableFar
  "subZone": "developed",        // echoed back when applicable (Ghaziabad)
  "groundCoverage": 75,          // percent
  "maxBuiltUpArea": 528,         // sqm, = totalFar × plotArea
  "totalAreaRealFar": 290,       // sqm, with Real FAR only
  "totalAreaWithPurchasable": 528,
  "maxFloorsRealFar": 1,         // floors achievable at full GC with Real FAR only
  "maxFloorsWithPurchasable": 3,
  "setbacks": { "front": 2.0, "rear": 2.0, "side1": 0, "side2": 0 },
  "basementInfo": { ... },
  "stiltInfo": { ... },
  "floors": [ ... ],
  "compliance": { "fireNOC": {...}, "rainwaterHarvesting": {...}, ... }
}
```

**Backward-compat guarantee:** `applicableFar` continues to equal totalFar. Older clients keep working without changes.

---

## Data model (Postgres, via TypeORM)

Tables are auto-synchronised by TypeORM in non-prod and explicitly seeded in prod.

```
cities                 (5 rows: delhi, noida, gurugram, ghaziabad, faridabad)
plot_size_rules        (26 rows total — see breakdown below)
basement_rules         (5 rows, one per city)
stilt_rules            (5 rows, one per city)
compliance_rules       (25 rows = 5 cities × 5 rule types)
road_width_rules       (0 rows — Gurugram road-width FAR was retired in Haryana 2024 memo)
```

**`plot_size_rules` — the heart of the calculator** (key columns):

| Column | Type | Notes |
|---|---|---|
| `city_id` | varchar | FK to cities |
| `sub_zone` | varchar(50), nullable | `developed` / `new_development` for Ghaziabad; null otherwise |
| `min_size_sqm` | decimal | bracket lower bound (inclusive) |
| `max_size_sqm` | decimal, nullable | bracket upper bound (exclusive); null = no upper bound |
| `real_far` | decimal | base FAR per bylaws |
| `purchasable_far` | decimal | additional FAR purchasable from authority |
| `far` | decimal | **total** FAR = real + purchasable; the buildable cap. Kept under name `far` for back-compat. |
| `ground_coverage` | decimal | percent |
| `setback_front`, `setback_rear`, `setback_side1`, `setback_side2` | decimal | meters |
| `max_height` | decimal | meters |
| `max_floors` | int | floor cap |
| `max_dwelling_units` | int | unit cap |
| `notes` | text | human-readable summary |

Plot-size rule counts by city:
- **delhi** — 5 brackets
- **noida** — 3 brackets
- **gurugram** — 5 brackets
- **ghaziabad** — 8 brackets (4 developed + 4 new_development)
- **faridabad** — 5 brackets (mirrors gurugram, same HUDA rules)

---

## Bylaw tables (locked source of truth)

These came from Varun's official spreadsheet (April 2026). The seed file `src/database/seed.ts` mirrors them exactly. **If the spreadsheet changes, edit seed.ts and re-seed (process below).**

### Gurugram & Faridabad (HUDA, by sqm)

| Plot (sqm) | Real FAR | Purchasable | Total | GC % | Front (m) | Rear (m) | Basement |
|---|---|---|---|---|---|---|---|
| 1–100 | 1.65 | 0.99 | 2.64 | 75 | 1.5 | 1.0 | Not allowed |
| 101–250 | 1.45 | 1.19 | 2.64 | 75 | 2.0 | 2.0 | Not allowed |
| 251–350 | 1.25 | 1.15 | 2.40 | 66 | 3.0 | 3.0 | Single level |
| 351–500 | 1.20 | 1.20 | 2.40 | 66 | 3.0 | 3.0 | Single level |
| 501–1000+ | 1.00 | 1.40 | 2.40 | 66 | 3.0 | 3.0 | Single level |

### Noida (by sqm)

| Plot (sqm) | Real FAR | Purchasable | Total | GC % | Notes |
|---|---|---|---|---|---|
| 1–300 | 1.80 | 0 | 1.80 | 75 | Max S+3 / G+2 |
| 301–500 | 1.80 | 0 | 1.80 | 65 | Max S+3 / G+2 |
| 501+ | 1.50 | 0 | 1.50 | 60 | Max S+3 / G+2 |

Noida bylaws exclude balconies, stilt, basement, lift shaft, and mumty from FAR calculation.

### Delhi (by sqm)

| Plot (sqm) | Real FAR | Purchasable | Total | GC % |
|---|---|---|---|---|
| ≤100 | 3.50 | 0 | 3.50 | 90 |
| 101–250 | 3.00 | 0 | 3.00 | 75 |
| 251–750 | 2.25 | 0 | 2.25 | 75 |
| 751–1000 | 1.50 | 0.05 | 1.55 | 50 |
| >1000 | 1.20 | 0.05 | 1.25 | 50 |

### Ghaziabad — Developed Area (by sqm)

| Plot (sqm) | Real FAR | Purchasable | Total | GC % |
|---|---|---|---|---|
| ≤100 | 2.00 | 0.50 | 2.50 | 75 |
| 101–300 | 1.75 | 0.50 | 2.25 | 65 |
| 301–500 | 1.50 | 0.50 | 2.00 | 55 |
| >500 | 1.25 | 0.50 | 1.75 | 45 |

### Ghaziabad — New Development Area (by sqm)

| Plot (sqm) | Real FAR | Purchasable | Total | GC % |
|---|---|---|---|---|
| ≤100 | 1.80 | 0.05 | 1.85 | 65 |
| 101–300 | 1.80 | 0.05 | 1.85 | 60 |
| 301–500 | 1.80 | 0.05 | 1.85 | 55 |
| >500 | 1.50 | 0.05 | 1.55 | 45 |

---

## Code map (backend)

```
src/
├── app.module.ts               # NestJS root, wires TypeORM + modules
├── main.ts                     # bootstrap, CORS, Swagger, /health
├── common/utils/
│   ├── unit-converter.ts       # sqm/sqft/sqyd/gaj conversions, plot dim estimation
│   └── unit-converter.spec.ts
├── database/
│   └── seed.ts                 # ⚠️ Source of truth for ALL bylaw data. Run via npm run db:seed.
├── far/
│   ├── entities/               # TypeORM entities
│   │   ├── city.entity.ts
│   │   ├── plot-size-rule.entity.ts    # the key one — has realFar, purchasableFar, subZone
│   │   ├── basement-rule.entity.ts
│   │   ├── stilt-rule.entity.ts
│   │   ├── compliance-rule.entity.ts
│   │   ├── road-width-rule.entity.ts
│   │   └── index.ts
│   ├── dto/
│   │   ├── calculate-far.dto.ts        # request DTO + SubZone type
│   │   ├── far-response.dto.ts         # response DTO
│   │   └── index.ts
│   ├── far.service.ts          # ⚠️ Core calculation logic. findApplicablePlotRule honours subZone.
│   ├── far.controller.ts
│   └── far.module.ts
└── floor-plan/                 # AI floor plan generation (separate feature, uses Anthropic SDK)
```

**`test-server.js`** at the repo root is a standalone Express server with hard-coded data, useful for local-without-Postgres dev only — NOT what's deployed. Dockerfile uses `dist/main` (NestJS).

---

## Code map (front-end, in `Zuildup` mono-repo `web/`)

```
web/src/
├── app/page.tsx                          # main page, hosts FarCalculator
├── components/
│   ├── FarCalculator.tsx                 # the form. Renders subZone dropdown when city=ghaziabad.
│   ├── FarResults.tsx                    # results card. Shows Real / Purchasable / Total split.
│   └── design/                           # unrelated AI design feature
├── lib/
│   ├── api.ts                            # fetchApi helpers, calls API_BASE_URL
│   ├── pdf-generator.ts                  # jsPDF report
│   ├── floor-plan/                       # design feature
│   └── mock-floor-plan-generator.ts
└── types/
    ├── far.ts                            # FAR API types: SubZone, CalculateFarRequest, FarCalculationResponse
    └── design.ts
```

API base URL is `https://far-service-176777907104.asia-south1.run.app` (overridable via `NEXT_PUBLIC_API_URL`).

---

## Deploy procedures

### Deploy backend changes

```bash
# From the OpenClaw VM, or any host with gcloud + project access
cd /opt/openclaw/workspace/zuildup/far-api
git push origin main                          # save source
gcloud config set project zuildup-prod
gcloud run deploy far-service \
  --source . \
  --project=zuildup-prod \
  --region=asia-south1 \
  --quiet
```

Cloud Build picks up the Dockerfile, builds (`nest build` → `dist/main`), pushes image, rolls out new revision. Zero-downtime — old revision keeps serving until new one is ready.

Build typically takes 5–7 minutes.

### Deploy front-end changes

Just push to `main` on `varunmahna-creator/Zuildup`. Netlify auto-builds and publishes within ~3 minutes.

### Re-seed database (when bylaws change)

The DB is Cloud SQL Postgres. The seed script TRUNCATEs and re-inserts all data, so it's idempotent.

**Step 1 — temporarily whitelist the running host's egress IP**:
```bash
MYIP=$(curl -s ifconfig.me)
gcloud sql instances patch zuildup-db \
  --project=zuildup-prod \
  --authorized-networks=14.194.36.210/32,$MYIP/32 \
  --quiet
# Wait ~30s for SQL to apply the patch
```

**Step 2 — get the DB password**:
```bash
DB_PW=$(gcloud secrets versions access latest --secret=db-password --project=zuildup-prod)
```

**Step 3 — run the seed**:
```bash
cd /opt/ocplatform/workspace/zuildup/far-api
DATABASE_HOST=34.100.203.4 \
DATABASE_PORT=5432 \
DATABASE_USER=postgres \
DATABASE_PASSWORD="$DB_PW" \
DATABASE_NAME=zuildup_far \
npx ts-node src/database/seed.ts
```

Expected output ends with `🎉 Database seeded successfully!` and a summary (5 cities, 26 plot rules, etc.).

**Step 4 — revoke the temp whitelist**:
```bash
gcloud sql instances patch zuildup-db \
  --project=zuildup-prod \
  --authorized-networks=14.194.36.210/32 \
  --quiet
```

(`14.194.36.210/32` = Varun's standing whitelist; never remove that one.)

### Verify production after deploy

```bash
# Spot-check Gurugram 200 sqm — expect Real 1.45, Purch 1.19, Total 2.64, GC 75%
curl -s -X POST https://far-service-176777907104.asia-south1.run.app/api/v1/far/calculate \
  -H "Content-Type: application/json" \
  -d '{"city":"gurugram","plotArea":200,"plotUnit":"sqm","desiredFloors":3,"wantBasement":false,"wantStilt":true,"wantTerrace":true,"wantBalcony":true,"wantLift":false}' \
  | python3 -m json.tool | grep -E '"realFar"|"purchasableFar"|"totalFar"|"groundCoverage"'
```

Full 12-case verification matrix is in the project history (Apr 29 deploy passed all 12).

---

## Project history

### 2026-02-18 — Original v1 deploy
Initial NestJS service deployed to Cloud Run, backed by Cloud SQL. 5 cities, basic FAR calc. Front-end on Netlify.

### 2026-02-24 (commits 3af13c2, 206ba1c) — HUDA fixes
- Single-basement-only across all cities
- Gurugram/Faridabad bylaws updated to Haryana 2021/2024 memos

### 2026-02-24 (commit 2e0f4eb)
- Relaxed tsconfig strict mode for clean Cloud Run build

### 2026-04-29 — Bylaw recalibration to spreadsheet (this work)
**Trigger:** Varun supplied an updated bylaw spreadsheet (`Calculator-*` tabs and `Bye Laws-*` tabs) and said "use this as the logic; sheet is law; if something isn't covered, keep our existing logic."

**Changes shipped:**
1. **`plot_size_rules` schema** — added `real_far`, `purchasable_far`, `sub_zone` columns. Existing `far` column repurposed to mean "total FAR" (= real + purchasable). Backward-compatible.
2. **All 5 cities recalibrated** — see the bylaw tables above. Notable shifts:
   - Delhi 80 sqm now correctly returns 3.50 FAR / 90% GC (was wrong before)
   - Gurugram now exposes the Real / Purchasable split that the sheet defines
   - Ghaziabad now has two distinct rule sets via the sub-zone toggle
3. **Service** — `findApplicablePlotRule` now filters by `subZone` first, falls back to subzone-less rules. New response fields: `realFar`, `purchasableFar`, `totalFar`, `subZone`, `totalAreaRealFar`, `totalAreaWithPurchasable`, `maxFloorsRealFar`, `maxFloorsWithPurchasable`.
4. **Front-end** —
   - `types/far.ts`: added `SubZone` type, optional `subZone` request field, new response fields
   - `FarCalculator.tsx`: renders a "Zone Type" dropdown when city is ghaziabad; passes subZone in request
   - `FarResults.tsx`: redesigned the main stats card to show Real / Purchasable / Total side-by-side, plus a subzone label when applicable
5. **Same UI/UX** — only addition is the Ghaziabad zone dropdown. Everything else (form layout, PDF export, branding) untouched per Varun's directive.

**Verification:** 12 test cases run against live API after deploy; all 12 pass. Sample:
```
Gurg 200sqm:        Real 1.45  Purch 1.19  Total 2.64  GC 75%  ✓
Gurg 80sqm:         Real 1.65  Purch 0.99  Total 2.64  GC 75%  ✓
Gurg 700sqm:        Real 1.00  Purch 1.40  Total 2.40  GC 66%  ✓
Faridabad 200sqm:   Real 1.45  Purch 1.19  Total 2.64  GC 75%  ✓
Delhi 80sqm:        Real 3.50  Purch 0     Total 3.50  GC 90%  ✓
Delhi 200sqm:       Real 3.00  Purch 0     Total 3.00  GC 75%  ✓
Delhi 800sqm:       Real 1.50  Purch 0.05  Total 1.55  GC 50%  ✓
Noida 200sqm:       Real 1.80  Purch 0     Total 1.80  GC 75%  ✓
Noida 600sqm:       Real 1.50  Purch 0     Total 1.50  GC 60%  ✓
Ghz Dev 200sqm:     Real 1.75  Purch 0.50  Total 2.25  GC 65%  ✓
Ghz NewDev 200sqm:  Real 1.80  Purch 0.05  Total 1.85  GC 60%  ✓
Ghz Dev 600sqm:     Real 1.25  Purch 0.50  Total 1.75  GC 45%  ✓
```

**Commits:**
- Backend: `varunmahna-creator/Zuildup-FAR-Api` → `d98eeb8` (`feat: split FAR into Real / Purchasable / Total per spreadsheet bylaws`)
- Front-end: `varunmahna-creator/Zuildup` → `a015198` (`feat(far): show Real / Purchasable / Total FAR split + Ghaziabad subzone toggle`)
- Cloud Run revision: `far-service-00019-8rq`

---

## Conventions / decisions to remember

1. **The spreadsheet is law.** When bylaws change, the spreadsheet (`Calculator-*` + `Bye Laws-*` tabs) is the single source of truth. Anything not covered by the sheet (compliance rules, stilt height, basement uses, etc.) keeps the existing logic.

2. **`far` column = total FAR.** Don't add another "total" column. Existing API consumers depend on `applicableFar` returning the totalFar number; that's preserved.

3. **Sub-zones are optional and city-specific.** Today only Ghaziabad uses them. The lookup falls back gracefully when subZone is omitted (returns rules where `sub_zone IS NULL`, or all rules if none qualify).

4. **Faridabad mirrors Gurugram.** The seed builds Faridabad rules as `gurugramPlotRules.map(...)`. If HUDA splits them in the future, replace that with a separate explicit table.

5. **No new GCP projects for this app.** It lives in `zuildup-prod`, alongside other ZuildUp services. Per the workspace cloud-platform rule (May 2026), all new ZuildUp work stays on Google Cloud only.

6. **Schema migrations are zero-downtime.** Add columns with safe defaults; don't drop or rename. Old binaries keep working with new columns, new binaries see new columns; flip the seed last.

7. **TypeORM `synchronize`** is enabled in non-prod and disabled in prod. New columns reach prod via the next deploy's auto-sync (because `synchronize: configService.get('NODE_ENV') !== 'production'` — wait, that's actually backwards: it's ON when not production, OFF when production). In prod, columns appear because the seed runs against a fresh DB and the entities define them. Be careful: if you deploy code that references new columns BEFORE re-seeding, the API will throw on first call. **Order: deploy code → re-seed → verify.** (April 29 deploy actually re-seeded first, then deployed; both orders work because new columns have defaults.)

---

## Known limitations / future work

- **No automated tests on the calculator.** `far.calculation.spec.ts` exists but is sparse. Worth adding a parametric test that loads the spreadsheet and asserts every bracket → expected output. Would catch any future regression on bylaw changes.
- **Compliance rules are simplistic.** Fire NOC threshold etc. are city-agnostic — could be tightened with city-specific data.
- **Road-width FAR is dormant.** `road_width_rules` table exists but has 0 rows since Haryana removed road-width FAR in the 2024 memo. If Delhi or another city reintroduces it, the service code already handles it (`getFarByRoadWidth`).
- **PDF report doesn't show the Real/Purchasable split yet.** Currently still shows just `applicableFar`. Quick addition when wanted.
- **The Floor Plan AI feature** in `floor-plan/` is unrelated to FAR but lives in the same service. Worth splitting into its own service if it grows.

---

## Operational secrets / where to find them

| What | Where |
|---|---|
| GitHub PAT (for both `Zuildup` and `Zuildup-FAR-Api`) | `/home/varunmahna/.config/gh/hosts.yml` (oauth_token) on the OpenClaw VM. Username = `varunmahna-creator`. |
| Cloud SQL password | Secret Manager `db-password` in `zuildup-prod`. Read with `gcloud secrets versions access latest --secret=db-password --project=zuildup-prod`. |
| Cloud SQL instance | `zuildup-db`, public IP `34.100.203.4`, only `14.194.36.210/32` whitelisted by default. |
| Netlify token | `/opt/openclaw/workspace/secrets/...` (workspace-level; same token used for all Netlify ops). |

---

## Filesystem notes (for the OCPlatform agent)

The VM session sometimes has intermittent ENOENT issues on nested `cd path/to/dir` chains — files momentarily appear to vanish. Workarounds that work:
- Use absolute paths everywhere; never rely on `cd` persistence across Bash calls.
- If `Read`/`Edit` tools flake, fall back to `cat`/`sed`/`Write`.
- Don't bail just because `mount | grep "on / "` shows `ro`. That reflects the agent's mount-namespace policy, not actual write permission. Test with a real `touch` to confirm.

---

## Contact / handoff

If you (next agent or human) are stepping in:
1. Read this whole file before touching anything.
2. Read `src/database/seed.ts` to see the actual numbers in code.
3. Read `src/far/far.service.ts` (~520 lines) for the calculation logic.
4. Test against the verification matrix before declaring any change "done."
5. End-to-end means **on the live URL**: open https://zuildup-far.netlify.app, run a real input, see a real result. Not "build passed" / "API returned 200."

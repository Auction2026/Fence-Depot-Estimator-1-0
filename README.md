# Fence Depot Chain-Link Estimator 1.0

Production-oriented first release of the Fence Depot estimator focused **only on chain-link fencing**.

## Scope of this release

This version supports:
- chain-link customers, jobs, products, variants, pricing, estimates, revisions, approvals, contracts, yearly numbering, and ACE POS sync boundaries;
- deterministic chain-link takeoff and pricing;
- a wizard-driven SPA workflow for building, reviewing, saving, opening, and accepting chain-link estimates.

This version is **out of scope** for:
- wood fencing;
- vinyl / PVC fencing;
- ornamental / wrought iron fencing;
- guide rail;
- bollards;
- any other non-chain-link material;
- live ACE POS API calls or external credentials;
- permit scraping or underground utility integrations.

## Business profile prefilled

- **Fence Depot**
- **3045 Pitt Street, Cornwall, Ontario K6K 1A9**
- **613-932-0717**
- **fencedepot@hotmail.com**

## Stack

- Next.js 16 App Router + TypeScript
- Prisma ORM + PostgreSQL
- Tailwind CSS 4
- Vitest for core domain and service tests

## What is included

- modular Prisma schema for chain-link-only estimating and operations;
- seeded demo/sample chain-link catalog with ACE POS/PLU boundary fields, images-ready fields, inventory, cost, and retail pricing;
- chain-link pricing logic for:
  - fence length
  - line-post spacing and rounding
  - end/corner/gate terminal counts
  - fabric with waste
  - top rail stock-length rounding
  - tension bars / tension bands / brace bands / tie wires
  - single and double swing gates
  - concrete footing or driven-post installation modes
  - labour, equipment, freight, contingency, markup or margin, and Ontario HST;
- audit-friendly line item overrides with reason capture;
- estimate acceptance service that creates a contract while preserving the estimate revision;
- ACE POS sync log, staging, and inventory-reservation boundary tables only.

## Project structure

- `src/app` - Next.js routes, pages, and API handlers
- `src/components/estimator` - wizard UI and estimate actions
- `src/lib/domain` - deterministic chain-link takeoff/pricing logic
- `src/lib/services` - persistence, numbering, contract conversion, and reference-data services
- `src/lib/validation` - zod request validation
- `prisma/schema.prisma` - chain-link-only relational schema
- `prisma/seed.ts` - demo/sample chain-link seed data
- `prisma/migrations` - initial PostgreSQL migration

## Bootstrap

### 1) Install dependencies

```bash
npm install
```

### 2) Start PostgreSQL

Use Docker Compose:

```bash
docker compose up -d
```

Or use your own PostgreSQL instance and point `DATABASE_URL` to it.

The included Docker setup uses:
- database: `fence_depot_estimator`
- user: `postgres`
- password: `fence_depot_local_dev`

### 3) Create local environment file

```bash
cp .env.example .env
```

### 4) Run migrations

```bash
npm run db:deploy
```

For local iterative development you can also use:

```bash
npm run db:migrate
```

### 5) Seed demo/sample chain-link data

```bash
npm run db:seed
```

### 6) Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Verified commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Database and schema summary

Main tables/models:
- `CompanySetting`
- `Customer`
- `ProjectSite`
- `Product`
- `ProductVariant`
- `ProductPriceHistory`
- `LabourRate`
- `EquipmentRate`
- `NonStockItem`
- `Estimate`
- `EstimateRevision`
- `EstimateRun`
- `EstimateGate`
- `EstimateLineItem`
- `EstimateCostComponent`
- `EstimateApproval`
- `Contract`
- `DocumentSequence`
- `InventoryReservation`
- `AceSyncLog`
- `AceSyncStagingRecord`

The schema is intentionally extensible, but it does **not** add business logic or product types for non-chain-link materials in this release.

## Chain-link estimating assumptions

Defaults are exposed in company settings and demo seed data.

- canonical calculation length unit is **millimetres**;
- user-facing dimensions can be entered and documented in either metric or feet/inches, with helper conversion utilities in `src/lib/units.ts`;
- default line-post spacing is **10 ft**;
- default fabric waste is **5%**;
- default top rail stock length is **21 ft 3 in**;
- tension bands per terminal post use `max(3, ceil(height in feet) - 1)`;
- brace bands default to **2 per terminal post**;
- tie wires default to **1 per foot** of fence run length;
- concrete footing volume uses a cylindrical footing formula based on configured diameter and depth;
- concrete bags are estimated from a seeded demo assumption of roughly **0.014 m³ per 30 kg bag**;
- pricing uses integer cents and controlled rounding only;
- Ontario HST defaults to **13%**, but is configurable;
- markup mode adds a percentage to cost; margin mode backs into sell price from target gross margin.

## Wizard flow

1. Customer and project details
2. Chain-link run configuration
3. Gates
4. Labour, equipment, non-stock, freight, contingency, markup/margin, tax
5. Takeoff and override review
6. Estimate summary and save

## ACE POS integration boundary

This release includes **boundary models only**:
- `acePlu`, `sku`, and manufacturer identifiers on products/variants;
- `AceSyncLog` for inbound/outbound sync events;
- `AceSyncStagingRecord` for normalized staging payloads;
- `InventoryReservation` for estimate-to-inventory reservation payload staging.

No external API calls, credentials, jobs, or live ACE POS synchronization are included in this release.

## Demo/sample data

Seeded records are clearly labeled as `Demo/sample` and are editable after seeding.

Included demo/sample records cover:
- black vinyl-coated chain-link fabric;
- line, terminal, and gate posts;
- top rail;
- tension bars, bands, brace bands, and ties;
- concrete mix;
- gate hardware and frame kit;
- labour and equipment rates;
- one realistic sample estimate.

## API/service layer

API routes:
- `POST /api/estimates`
- `GET /api/estimates/[id]`
- `POST /api/estimates/[id]/accept`

Services and domain logic are separated so future integrations can reuse validated, tested takeoff/pricing logic without coupling it to the UI.

## Accessibility and UI basics

The interface includes:
- labeled inputs
- keyboard-usable form controls
- clear empty states
- inline error reporting on save/accept actions
- responsive layouts for dashboard, detail, and wizard pages

## Current limitations

- permit/utility ingestion and external catalog scraping are intentionally deferred;
- document/PDF generation is not yet implemented, but the summary screen is structured for it;
- the first release uses demo/sample estimating assumptions that should be reviewed and tuned before production pricing use.

# Makerspace directory

A standalone Next.js app mounted at `/makerspace`. Search comes first, followed by workshop categories. Results are a filterable table; every item has a shareable page with related tools or accessories. The palette follows the supplied navy/turquoise/orange/red/lime reference with Windows 95 window frames and beveled controls.

## Included

- Search by names, brands, models, aliases, materials, tasks, and categories. Examples: `dremel`, `allen wrench`, `soldering`, `cut metal`.
- Category, material, task, and kind filters. Filters combine with AND. Search terms also combine with AND; task synonyms such as `cut` → `cutting` are supported.
- Shareable URLs; browser Back restores filters.
- Tool, accessory, consumable, component, fixture, safety, and utility distinctions.
- Bidirectional item-to-item and item-to-type compatibility relationships.
- Postgres migrations, a repeatable initial import, and a public data projection that excludes internal metadata.
- Responsive layouts, labeled controls, keyboard focus states, a skip link, reduced-motion support, and accessible tables.

There are no locations, quantities, accounts, login screens, admin routes, forms that write to Postgres, Server Actions, or public mutation APIs. The database itself remains writable. Schema/import commands run outside the web app using server-side credentials.

## Run a design preview

Requires Node 22 or later.

```bash
npm ci
cp .env.example .env.local
```

In `.env.local`, remove the placeholder `DATABASE_URL` and set `CATALOG_DEMO=true`, then run:

```bash
npm run dev
```

Open `http://localhost:3000/makerspace`.

The preview explicitly says the database is not connected. It uses the initial import fixture only. `CATALOG_DEMO` is ignored on Vercel, and database errors never silently switch to fixture data. The fixture is **not** the production source of truth.

## Connect Postgres and deploy to Vercel

1. Import this project into Vercel; use the Next.js framework preset and Node 22 or later.
2. From the project's Storage/Marketplace area, add a Postgres provider on its **Free** plan. Neon is an option; Vercel's former native Postgres product was retired. A separately created standard Postgres database also works.
3. Set `DATABASE_URL` to the provider's pooled connection string, including its TLS parameters. If the integration supplies only `POSTGRES_URL`, copy its value to `DATABASE_URL` in the Vercel environment settings. Never prefix this secret with `NEXT_PUBLIC_`.
4. Put the corresponding connection string in local `.env.local`, with `CATALOG_DEMO=false`, and initialize that database:

```bash
npm run db:migrate
npm run db:seed
npm test
npm run build
```

5. Deploy/redeploy once the schema and seed exist. Keep the build command as `npm run build`. Do not automatically run migrations or seed imports on each Vercel build. Use a separate database or provider branch for preview deployments.

The migration runner uses a transaction, advisory lock, and checksums. Add a new numbered migration when the schema changes; never edit an applied migration. The seed import is transactional and preserves existing item edits and classifications on repeated runs. Archive catalog records rather than deleting them.

No paid service, cron, hosted search engine, AI endpoint, or auth provider is required. Database reads are cached for five minutes; filtering the small catalog runs in the browser without a database call per keystroke. Free-tier quotas can still limit availability. Vercel Hobby also limits use to personal, noncommercial projects; check whether your makerspace use qualifies. Do not enable a paid database plan to deploy this app.

## Add it to your existing domain

This project is deliberately independent of your existing site's framework.

**If the existing site is Next.js:** the cleanest integration is to port the `/makerspace` routes, components, library, and database layer into that project, resolving its root layout and CSS with the existing site. Do not replace its root layout or config blindly.

**If you deploy as a separate Vercel project:** configure these external rewrites on the project that owns your domain, replacing `catalog-project.vercel.app` with the catalog deployment:

```json
{
  "rewrites": [
    { "source": "/makerspace", "destination": "https://catalog-project.vercel.app/makerspace" },
    { "source": "/makerspace/:path*", "destination": "https://catalog-project.vercel.app/makerspace/:path*" },
    { "source": "/makerspace-assets/_next/:path*", "destination": "https://catalog-project.vercel.app/_next/:path*" }
  ]
}
```

Merge these rules with the existing site's routing configuration, before any catch-all rewrite. Set `CATALOG_ASSET_PREFIX=/makerspace-assets` on the **catalog project** and rebuild it. This keeps the two projects' Next.js assets from conflicting. The catalog's icon lives within `/makerspace`. Leave `CATALOG_ASSET_PREFIX` unset when accessing only the standalone deployment, because the asset prefix relies on the parent site's rewrites. Test the public domain's catalog route, filters, detail-page refresh, and icon after integration.

No domain change or Vercel deployment was performed during this build. The existing project and connected database were not supplied.

## Data model

| Entity | Purpose |
|---|---|
| `catalog_items` | Stable UUID/slug, name, brand/model, kind/type, description, aliases, uncommon metadata, archive timestamps |
| `item_kinds` | Extensible controlled item classes |
| `item_types` | Product/tool families with an optional parent; hierarchy cycles are rejected |
| `facets`, `facet_values` | Controlled category, material, and process values; new facets can be added |
| `item_facet_values` | Deduplicated item classifications |
| `compatibility` | Source item plus exactly one specific item or type target, verification state, and fit notes |
| `catalog_public` | Public projection that omits private import provenance/metadata |

Type compatibility matches the **exact assigned type**. It does not automatically apply to descendants. A type label alone is not proof of mechanical/electrical fit. Unverified relationships are rendered as “Check fit”; only reviewed relationships should be marked verified. Facets express discovery relevance, not a guarantee that a tool performs every material/task combination. The app does not infer a capability by combining unrelated facets or accessories.

UUIDs remain stable when names change. Slugs are unique. Brand/model/type combinations are deliberately not globally unique: incomplete model information can describe distinct products. Potential new duplicates should be reviewed before adding a record. Physical stock/asset tracking can be added later without changing catalog identity.

The data access module is server-only and uses standard `pg`, so Postgres providers can be changed without changing the UI. It never changes database permissions or enables a read-only transaction. There is no schema for authentication or speculative stock tracking.

## Inventory review notes

The attached list contains **150 source rows**. The initial import produces **150 canonical entries**:

- The two WAGO 221 listings are merged into one provisional catalog item, retaining both source rows in internal provenance. No quantity is inferred. Review connector variants before splitting it further.
- “Weller WLC100, Bakon” becomes two soldering-station records. Bakon's model remains unknown.
- Different printer, jigsaw, drill-bit, and heat-shrink products remain separate.
- The Dremel tool kit is separate from the Rotary Tool Accessory Kit. Its model and contents remain unrecorded.
- The laser-cutting category exists, but the source lists no laser cutter. The Cricut is classified as a cutting machine, not a laser cutter.
- Materials/processes/categories are provisional discovery metadata assigned during import, not manufacturer-certified specifications.
- The source has no availability/condition information. The app says “listed items,” not “available tools.”
- Lichtenberg equipment includes a high-voltage/access note; its listing is not a recommendation to use it.

`db/seed-data.json` is a one-time bootstrap fixture and local preview input. **Maintain live catalog records in Postgres**, using your provider's SQL editor or a trusted offline script until an authenticated administration workflow is intentionally added. Re-running the seed never overwrites catalog descriptions or classifications, although it can re-add missing bootstrap relationships. Do not use seeding as an ongoing edit/sync workflow.

## Structure and verification

```text
app/makerspace/           Browser and item detail routes
components/              Directory controls and window shell
lib/                     Public types, pure search, server-only catalog reads
db/migrations/           Versioned Postgres schema
db/seed-data.json        Initial import fixture
scripts/                 Offline schema/import commands
tests/                   Search, relationship, URL, and Postgres integrity checks
```

Run `npm run typecheck`, `npm test`, and `npm run build`. Tests use PGlite to execute the actual Postgres schema/import/projection; they verify constraints, archiving, duplicate normalization, public metadata exclusion, and preservation of database edits. No database credential is required for tests.

Build and type checks passed. Four test cases passed. The build used an explicit local fixture preview; no live hosted Postgres connection was available. Browser screenshots and interaction QA could not run because the preview/browser infrastructure was unavailable. Responsive and accessibility behavior is implemented but requires a final browser check on the actual deployment.

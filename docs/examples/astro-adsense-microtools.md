# Walkthrough — Astro micro-tools with AdSense monetization

Scenario: a free website with QR Generator, JSON Formatter and Image Compressor, aiming for **legitimate search traffic + advertising**. No guarantee of publisher approval, SEO ranking or earnings. Build useful tools first; ad placement is a secondary concern.

## 1. Prerequisites and selection

Node.js 22+, Git, an existing Astro app, and an `aih` CLI bundle including the optional monetization capability. If you need an Astro starter use the upstream Astro CLI separately; Harness installs only rules/skills.

```bash
cd /path/to/astro-utilities
aih resolve --adapters astro --capabilities product,uiux,monetization
aih init --adapters astro --capabilities product,uiux,monetization --dry-run
aih init --adapters astro --capabilities product,uiux,monetization
aih check
aih skills
aih skill harness-astro-project-architecture
aih skill harness-monetization-adsense-integration
aih skill harness-monetization-seo-growth
```

Product/UIUX are optional; the smallest setup is `aih init --adapters astro --capabilities monetization`. An existing installation must update `.notth/project.json` and use `aih update` instead.

## 2. Start with product and SEO, no ad code

Example route layout:

```text
src/pages/index.astro
src/pages/tools/qr-generator.astro
src/pages/tools/json-formatter.astro
src/pages/tools/image-compressor.astro
src/lib/qr/
src/lib/json/
src/lib/image/
docs/monetization/
```

First ask the AI host to inspect the project and plan tool-specific pages with useful original content, accessible forms/error handling and local processing. Example prompt:

> Read AGENTS.md plus harness-astro-project-architecture and harness-monetization-seo-growth. Plan three public micro-tools focused on real search intent, good mobile UX and static/browser-only processing. Separate verified keyword data, inference and unknowns. Do not add backend, database, web scraping, advertising scripts, ad account credentials or mock visitor counts. Propose routes, validation and meaningful descriptions; request my approval before code changes.

If Product is selected, use `aih new-doc prd-lite` for the product scope if needed. Monetization drafts use the installed capability explicitly, for example `aih new-doc site-monetization-plan --capability monetization`. This copies a blank template to project-owned `docs/monetization/` and refuses overwrite; the host fills it from actual evidence.

```bash
aih new-doc site-monetization-plan --capability monetization
```

## 3. Publisher readiness and policy review

Check the actual AdSense account/site approval status, original site content, user trust pages, privacy disclosures, intended visitors and third-party rights. Use `harness-monetization-publisher-compliance`. Do not publish provider tags or claim Google approval without account access/owner authorization.

Example prompt:

> Read installed monetization skills and workflow site-to-adsense. Create or complete docs/monetization/site-monetization-plan.md and privacy-consent-checklist.md from supplied evidence. Read current Google policies if web is enabled, recording URLs and check dates. Confirm which visitors need a certified CMP and flag gaps. Do not assume I already have an AdSense account or a publisher ID, and do not publish anything externally.

## 4. Review slots and add authorized ads only after approval

Draft mobile/desktop page designs with safe ad placement around, **not inside**, Generate/Download flows. Avoid accidental taps, misleading download-like labels and layout shift; confirm tool works when ads are blocked/not filled or required consent is absent.

Before production, confirm provider approval/permissions, account-supplied `ads.txt` content, deploy root path `/ads.txt`, correct CMP choice and actual deployment environment. Use `aih skill harness-monetization-ad-placement-ux`. For `ads.txt`, copy **only** a real seller line from the publisher account; Google highly recommends but does not universally require ads.txt.

Review actual responsive pages, consent choices, script loading, privacy and accessibility. Test production build using **scripts that exist** in the Astro project. `aih verify --scope all` is only advisory and no cloud/Google writes occur through CLI.

## 5. Measure and improve when real data exists

After launch and account authorization, use analytics/Search Console exports and provider earnings for the **same time window**; compare legitimate organic traffic by tool, Page RPM, cost of hosting/API and qualitative task completion. If access is absent, label metrics UNKNOWN and use explicit assumptions rather than fabricated earnings.

Example prompt:

> Read harness-monetization-analytics-revenue. Using only authorized metric exports with source dates, prepare docs/monetization/analytics-report.md. Separate actual earnings from scenarios; calculate Page RPM only if earnings and page views share a window, list hosting/API costs and propose one measurable SEO/UX improvement with a stop rule. No growth hacks that generate clicks or fake ad impressions.

```bash
aih verify --scope all
aih eval --scope all
aih check
```

`aih eval` emits an unscored evaluation dataset; it does not test Google compliance or call a model. Human review, real site/browser tests and publisher console observations are separate activities.

## 6. Scaling decisions

Keep a single Astro website with many routes until independent teams/deployments or very different runtimes require an MFE split. Monetization is stack-independent and follows your site/business across Astro/React changes. Never use MFE, Kubernetes or backend services simply because the website earns ad revenue.

Review [Monetization guide](../monetization.md), [Astro micro-tools](astro-micro-tools.md) and [Monetization capability](../../capabilities/monetization/README.md) for reusable procedures.

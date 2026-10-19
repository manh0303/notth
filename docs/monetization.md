# Website monetization — ads as a business layer, not a framework dependency

The optional `monetization` capability is reusable for Astro, React/Next.js or a static website. It guides research, policy-safe ad UX and unit economics; it does **not** connect to Google accounts, add scripts, fetch ad statistics, generate clicks or promise income. The user needs a legitimate publisher-owned domain and valuable original tools/content.

## Choose modules

```bash
# Minimal website with advertising business workflow
aih resolve --adapters astro --capabilities monetization
aih init --adapters astro --capabilities monetization --dry-run
aih init --adapters astro --capabilities monetization
aih check
aih skills
aih skill harness-monetization-adsense-integration
aih skill harness-monetization-ad-placement-ux
aih verify --scope capabilities  # review checklist only, never a browser/policy scan
```

For React/Next.js, substitute `--adapters react-nextjs`. Add `product,uiux` only when discovery/design workflow is useful: `aih init --adapters astro --capabilities product,uiux,monetization`. For a project already initialized with Harness, update the `.notth/project.json` capabilities array on a branch and run `aih update --dry-run`, `aih update`, `aih check` (do **not** re-init). No extra runtime dependencies or AdSense credentials are needed to install this instructional module.

## Workflow A — website → AdSense application → approved integration

1. Build a working **useful tool** first: QR, format conversion, image, PDF or other legitimate user need. Avoid scraped, duplicated or thin generated pages. Prefer local browser processing to minimize operating cost and protect user input.
2. Prepare unique public tool URLs, descriptive content, privacy disclosures, appropriate contact/about/trust information and accessible mobile UX. Review applicable original-content/network rules.
3. Register/verify publisher-owned site in the actual AdSense account **outside Harness**. Eligibility and approval are Google decisions. If status is unknown, record UNKNOWN, not approved.
4. Review ad positions: keep actual tool input/output actions easy to find. Ads cannot impersonate navigation or Download/Generate buttons. Reserve stable slot area to reduce unexpected shift.
5. Determine site audience and legal/privacy/consent needs. For relevant personalized ads to EEA/UK/Swiss traffic Google requires a certified CMP integrated with the IAB TCF; decide approved solution with owner and applicable advisers.
6. If approved to publish, use the actual Google-provided ad integration and owner-authorized publisher details. `ads.txt` at the root domain is **highly recommended, not universally mandatory**; never invent an account/seller ID.
7. Human reviews actual changed pages, ad/no-fill/adblocked/consent UX and production release scope before deploy. `aih` cannot publish ads or deploy.

Project-owned artifacts: `docs/monetization/site-monetization-plan.md`, `ad-placement-review.md`, `privacy-consent-checklist.md`. The templates are installed at `.notth/capabilities/monetization/templates/` and can be scaffolded with `aih new-doc <type> --capability monetization` **without overwrite**; the default new-doc owner remains Product.

## Workflow B — traffic → financial learning

Use `harness-monetization-seo-growth` and `harness-monetization-analytics-revenue` to measure legitimate traffic quality, Page RPM, ad earnings and real hosting/API costs.

```text
Page RPM = (estimated earnings / page views) × 1000
Modeled earnings = (assumed page views / 1000) × assumed Page RPM
Modeled contribution = modeled earnings − explicitly scoped costs
```

Do not confuse Page RPM with ad-impression RPM, or `estimated earnings` with payments received. If no actual AdSense/analytics access exists, pageviews, RPM and income are UNKNOWN; show parameterized scenarios rather than inventing country-specific payouts. Report observed vs forecast numbers in `docs/monetization/analytics-report.md`. Review using owner-approved experiments without traffic manipulation or invalid clicks.

## Policy sources — recheck before every actual release

- [Google AdSense placement policies](https://support.google.com/adsense/answer/1346295?hl=en) — avoid accidental clicks, disguised ads/controls
- [Avoiding invalid traffic](https://support.google.com/adsense/answer/2660562?hl=en) — no click exchanges, self-clicks, forced/fake activity
- [Google ads.txt guide](https://support.google.com/adsense/answer/12171612?hl=en) — highly recommended; serve authorized records at root
- [Google publisher CMP/TCF requirements](https://support.google.com/adsense/answer/13554116?hl=en) — EEA, UK, Switzerland
- [Google Page RPM definition](https://support.google.com/adsense/answer/190515?hl=en) — metric, not guaranteed yield

Provider policies, privacy laws, pricing and revenue rates change. An AI-generated checklist does not establish legal compliance or Google site approval. Check exact pages, audiences, networks and dates.

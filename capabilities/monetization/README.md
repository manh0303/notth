# Monetization capability (optional, stack-independent)

Purpose: provide **review-gated** playbooks for small utility websites that earn money from legitimate advertising while protecting user experience, privacy and publisher policy compliance. Works with Astro, Next.js, static HTML or other web stacks; it does **not** create an AdSense account, guarantee approval, inject ads or receive revenue.

## Install

```bash
# Minimal Astro micro-tools website:
aih init --adapters astro --capabilities monetization
# Combine optional product and design:
aih init --adapters astro --capabilities product,uiux,monetization
aih check
aih skills
aih skill harness-monetization-adsense-integration
aih skill harness-monetization-ad-placement-ux
aih verify --scope capabilities
```

Use `aih resolve --adapters astro --capabilities monetization` or `aih init ... --dry-run` before installing. For an already installed project, edit the `capabilities` array in `.notth/project.json`, then `aih update --dry-run`, `aih update`, `aih check` on a branch.

All five skills are **instructions** exposed only if selected; `aih verify` is advisory and never checks remote approval status or runs a browser. Both workflows are Markdown contracts, not orchestrated jobs.

## Guides and ownership

- [Monetization start-to-finish walkthrough](../../docs/examples/astro-adsense-microtools.md)
- [Site → AdSense workflow](workflows/site-to-adsense.md)
- [Traffic → Revenue review](workflows/traffic-to-revenue-review.md)
- [Publication and policy references](../../docs/monetization.md)

Project-owned drafts belong in `docs/monetization/`. Review and copy the installed Markdown templates from `.notth/capabilities/monetization/templates/` **manually or through an authorized AI IDE**. `aih new-doc` is reserved for Product templates and does not generate monetization drafts.

## Non-negotiable boundaries

- Never simulate ad clicks/impressions, use bots/click exchanges, disguise ads as tool actions, or request users click ads.
- Ad blocks must be distinguishable from Download/Generate/Submit/navigation or any interactive control; reserve safe layout space and validate mobile touch UX.
- Before collecting data or serving region-specific ads, check current Google policies, consent tooling and applicable local legal requirements with responsible owner. For personalized ads in EEA/UK/Switzerland, Google documents Google-certified CMP + IAB TCF requirements.
- `ads.txt` is highly recommended by Google but not inherently mandatory; use the *real authorized publisher ID* supplied by the owner, not a made-up ID. Serve and verify the site's root URL.
- Handle ad-blockers, lack of fill, disabled JS and no consent without preventing the core free tool from working.
- Traffic, site approval, Page RPM and revenue projections must be sourced, labeled as measured/estimated/scenario and never guaranteed.
- No live integrations with AdSense, Analytics, Search Console, payment accounts or consent providers are installed by `aih`.

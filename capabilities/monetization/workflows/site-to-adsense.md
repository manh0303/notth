# From useful website to reviewable ad monetization

**Entry:** public utility/product site, including a small Astro or Next.js project. Ads monetization is a **commercial/UX workflow** independent of technology adapter or Product capability. The CLI only installs this Markdown contract.

1. **Define the real user value:** inventory real tools, unique content, mobile UX, page quality, domain ownership, prohibited or unclear third-party material. Research the market but avoid speculative promises of SEO traffic or account approval.
2. **Make the site useful first:** prioritize task success, accessibility, speed, clear instructions, navigable URLs, legal/trust pages and disclosure of actual privacy/data use.
3. **Check publisher policy and consent:** use `harness-monetization-publisher-compliance` to inspect current official rules, target regions and invalid traffic risks; assign human owner of unresolved policy/privacy decisions. Do not mark external AdSense status approved unless verified.
4. **Create plan:** copy `.notth/capabilities/monetization/templates/site-monetization-plan.md` into project-owned `docs/monetization/site-monetization-plan.md` using a reviewed IDE/file operation, without overwriting. (The Product-only `aih new-doc` command does *not* do this.)
5. **Design safely:** use `harness-monetization-ad-placement-ux` and approved UIUX designs where present. Prioritize tools; keep ads distinct from buttons/navigation and verify no-fill/no-consent/ad-block cases. Use the ad-placement review template.
6. **Technical handoff:** with site/account approved by the publisher and explicit developer permission, plan `ads.txt` (site root), actual provider tags, consent solution and tracking controls; never fabricate publisher IDs or deploy pre-approval.
7. **Review gate:** owner approves exact ad placement/code/consent/privacy disclosure and deployment target. Engineering team or authorized agent writes minimal safe changes using installed Astro/React adapter plus Core TDD/review; test actual pages.
8. **Measure after real launch:** review observed Search Console, analytics, account RPM and host costs in `traffic-to-revenue-review.md`. Treat scenarios as assumptions when there is no ad earnings evidence.

**Deliverables:** project-owned monetization plan, safe placement review, policy/consent checklist, explicit approval record and relevant test/build evidence. **No automatic AdSense approval, revenue, accounts, provider API access, ad clicks, deploy or merge.**

Policy sources to verify at time of use:
- https://support.google.com/adsense/answer/1346295?hl=en
- https://support.google.com/adsense/answer/12171612?hl=en
- https://support.google.com/adsense/answer/13554116?hl=en

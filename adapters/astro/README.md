# Astro adapter (optional)

Use for lightweight TypeScript websites, SEO landing pages and browser-first micro tools that may later host React islands or separately deployed applications. Not a project generator: installing this adapter writes rules and skills, not an Astro app or Cloudflare resources.

```bash
# Run inside an existing Astro project with installed aih CLI:
aih resolve --adapters astro --capabilities product,uiux
aih init --adapters astro --capabilities product,uiux --dry-run
aih init --adapters astro --capabilities product,uiux
aih check
aih skills
aih skill harness-astro-project-architecture
aih skill harness-astro-islands
aih verify
```

Only include `product` and `uiux` capabilities if required. For a preexisting Harness installation, edit `.notth/project.json` on a branch to add `astro` and run `aih update --dry-run`, `aih update`, `aih check`; do not reinitialize.

The detector checks for `astro` in the **target's root package.json declared dependencies**, without executing code; nested monorepo packages require `--target`. Using `@astrojs/react` / `react-dom` for islands should not cause an unnecessary React/Next.js adapter recommendation when there is no `next` dependency. Explicit adapter selections remain supported.

Choose native `.astro` and TypeScript for most tools, selective React hydration for complex interaction, and Cloudflare Workers only when server operations are necessary. For new Cloudflare deployments, check current official Workers guidance. Islands remain part of one Astro build; route-level reverse proxy or independently deployed apps are a separate, future MFE architecture decision.

Guide: [Astro micro-tool walkthrough](../../docs/examples/astro-micro-tools.md). Modules and source ownership: [adapter docs](../../docs/adapters.md).

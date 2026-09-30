# APIculture — API documentation portal

Developer documentation for the APIculture API, built as **docs-as-code**:

- `openapi/v1/openapi.yaml` is the single source of truth for the API surface. The interactive reference is rendered from it; SDKs and mocks can be generated from it.
- Guides, concepts and resources are Markdown/MDX in `src/content/docs/`, organised by the [Diátaxis](https://diataxis.fr/) model (tutorial → how-to → reference → explanation).
- Everything is linted and built in CI; a change to the API that lacks documentation cannot be merged.

## Stack

| Concern | Tool | Why |
| --- | --- | --- |
| Site generator | [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) | Static output, zero JS by default, sidebar/search/i18n/dark mode out of the box. |
| API reference | [Scalar](https://github.com/scalar/scalar) | Three-column layout, code samples in 20+ languages, built-in "Test request" client. |
| Spec quality gate | [Spectral](https://github.com/stoplightio/spectral) | Fails the build when an operation lacks a summary, description, error responses, examples or consistent naming. See `.spectral.yaml`. |
| Search | Pagefind (bundled with Starlight) | Static index, no external service. |
| Hosting | GitHub Pages (production), Cloudflare Pages (PR previews) | Static, free, CDN-backed. See `.github/workflows/docs.yml`. |

## Layout

```
openapi/
  v1/openapi.yaml            # source of truth for API v1 (add v2/ alongside when the time comes)
.spectral.yaml               # OpenAPI lint rules enforced in CI
src/
  content/docs/              # Markdown/MDX pages (Starlight)
    index.mdx                #   landing page
    getting-started/         #   tutorial: quickstart, authentication
    guides/                  #   how-to: pagination, idempotency, webhooks, rate limits
    concepts/                #   explanation: data model, hive lifecycle
    reference/index.md       #   how the reference is produced and how to use the spec
    resources/               #   errors catalogue, versioning policy, SDKs
    changelog.md
  pages/
    reference/v1.astro       # interactive reference (Scalar) for v1
    openapi/v1.yaml.ts       # serves openapi/v1/openapi.yaml at /openapi/v1.yaml
  plugins/satteri-base-links.mjs  # prefixes author-written links with Astro `base`
  content.config.ts          # Starlight collection (+ base-prefixing of hero links)
astro.config.mjs             # site config, sidebar
.github/workflows/docs.yml   # lint → check → build → deploy / preview
```

## Local development

```bash
npm install
npm run dev          # http://localhost:4321
npm run lint:openapi # Spectral only
npm run build        # lint + static build into dist/
npm run preview      # serve dist/
```

## Adding or changing an endpoint

1. Edit `openapi/v1/openapi.yaml`. Every operation needs `operationId`, `summary`, `description`, a tag, a documented `401`, and `application/problem+json` for all `4xx` responses; `POST`/`PUT`/`PATCH` bodies need an `examples` entry.
2. Run `npm run lint:openapi` — fix anything it reports.
3. If the change affects behaviour, add a guide or update an existing one in `src/content/docs/`, and add an entry to `src/content/docs/changelog.md`.
4. Open a PR. CI lints, builds and (once configured) posts a preview URL.

### Adding API v2

1. Copy `openapi/v1/` to `openapi/v2/` and edit.
2. Add `src/pages/openapi/v2.yaml.ts` and `src/pages/reference/v2.astro` (copy the v1 files, change the paths).
3. Add a sidebar entry in `astro.config.mjs` and mark v1 with a `deprecated` badge when appropriate.

## Deployment

The same build runs in two layouts; `ASTRO_SITE` / `ASTRO_BASE` control the origin and sub-path.

- **GitHub Pages (production).** One-time: *Settings → Pages → Source: GitHub Actions*. Every push to `main` deploys to `https://<owner>.github.io/APIculture/`.
- **Cloudflare Pages (PR previews).** One-time: create a Pages project (direct upload), then set repository variable `CF_PAGES_PROJECT` and secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Until the variable exists the preview job is skipped.
- **Custom domain.** Point the domain at either host and set `ASTRO_SITE=https://docs.example.com`, `ASTRO_BASE=/` in the workflow.

### "Test request" and CORS

The interactive reference sends requests from the browser. Until the API itself returns CORS headers for the docs origin, requests go through `https://proxy.scalar.com` (configured in `src/pages/reference/v1.astro`). For production either enable CORS on the sandbox host for the docs origin and remove `proxyUrl`, or self-host [Scalar's proxy](https://github.com/scalar/scalar/tree/main/projects/proxy-server).

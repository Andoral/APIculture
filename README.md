# APIculture — API documentation portal

Developer documentation for APIculture, built as **docs-as-code**. The same apiary / hive / inspection domain is exposed through several API styles. Each style has a machine-readable contract in `specs/`, a quickstart and a human-readable reference. REST and WebSocket also have a Scalar explorer.

## Stack

| Concern | Tool | Why |
| --- | --- | --- |
| Site generator | [Astro](https://astro.build) + [Starlight](https://starlight.astro.build) | Static output, zero JS by default, sidebar/search/i18n/dark mode out of the box. |
| REST reference | [Scalar](https://github.com/scalar/scalar) | Three-column layout, code samples, built-in "Test request" client. |
| Spec quality gate | [Spectral](https://github.com/stoplightio/spectral) + `scripts/lint-specs.mjs` | REST OpenAPI is linted with Spectral. WSDL, OpenRPC, proto, GraphQL SDL and AsyncAPI are parsed and checked structurally in CI. |
| Search | Pagefind (bundled with Starlight) | Static index, no external service. |
| Hosting | GitHub Pages (production), Cloudflare Pages (PR previews) | Static, free, CDN-backed. See `.github/workflows/docs.yml`. |
| Sandbox | `npm run sandbox` | In-memory server for REST, SOAP, JSON-RPC, GraphQL and WebSocket. gRPC stays contract-only (needs HTTP/2 + generated stubs). |

## Layout

```
specs/
  rest/v1/openapi.yaml           # OpenAPI 3.1
  soap/v1/apiculture.wsdl        # WSDL (document/literal)
  rpc/v1/openrpc.json            # OpenRPC 1.3
  grpc/v1/apiculture.proto       # Protocol Buffers 3
  graphql/v1/schema.graphql      # GraphQL SDL
  websocket/v1/asyncapi.yaml     # AsyncAPI 3
.spectral.yaml                   # OpenAPI lint rules
scripts/lint-specs.mjs           # all-style contract checks
sandbox/                         # local multi-style sandbox
src/
  content/docs/
    index.mdx                    # architecture, data model, map of styles
    getting-started/
    rest/                        # REST overview, quickstart, guides
    soap/ rpc/ grpc/ graphql/ websocket/
    reference/index.md           # contract catalog
    resources/ changelog.md
  pages/
    reference/rest/v1.astro      # Scalar
    reference/websocket/v1.astro
    specs/**                     # serves files from specs/
  lib/serve-spec.ts
astro.config.mjs                 # sidebar + redirects from old REST URLs
.github/workflows/docs.yml
```

## Local development

```bash
npm install
npm run dev          # http://localhost:4321
npm run sandbox      # http://127.0.0.1:8787  (REST / SOAP / JSON-RPC / GraphQL / WS)
npm run lint:specs   # Spectral + structural checks for every style
npm run build        # lint + static build into dist/
npm run preview      # serve dist/
```

Any `Authorization: Bearer ak_test_…` key works against the local sandbox. Each key gets its own isolated in-memory store. Production-shaped `ak_live_…` keys are rejected.

In the [REST Scalar reference](http://localhost:4321/reference/rest/v1/) pick the **Local sandbox** server, then use **Test request**.

## Adding or changing a REST endpoint

1. Edit `specs/rest/v1/openapi.yaml`. Every operation needs `operationId`, `summary`, `description`, a tag, a documented `401`, and `application/problem+json` for all `4xx` responses; `POST`/`PUT`/`PATCH` bodies need an `examples` entry.
2. Mirror the change in the other style contracts under `specs/` and in `sandbox/` if behaviour is affected.
3. Run `npm run lint:specs` — fix anything it reports.
4. If the change affects behaviour, update a guide under `src/content/docs/rest/` and add an entry to `src/content/docs/changelog.md`.
5. Open a PR. CI lints, builds and (once configured) posts a preview URL.

Old REST URLs (`/reference/v1/`, `/openapi/v1.yaml`, `/guides/…`, `/getting-started/quickstart/`) redirect to the new paths.

## Deployment

The same build runs in two layouts; `ASTRO_SITE` / `ASTRO_BASE` control the origin and sub-path.

- **GitHub Pages (production).** One-time: *Settings → Pages → Source: GitHub Actions*. Every push to `main` deploys to `https://<owner>.github.io/APIculture/`.
- **Cloudflare Pages (PR previews).** One-time: create a Pages project (direct upload), then set repository variable `CF_PAGES_PROJECT` and secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Until the variable exists the preview job is skipped.
- **Custom domain.** Point the domain at either host and set `ASTRO_SITE=https://docs.example.com`, `ASTRO_BASE=/` in the workflow.

### "Test request" and CORS

The local sandbox sends `Access-Control-Allow-Origin: *`, so Scalar talks to it directly (no proxy). A hosted production API should allow the docs origin the same way. The fictional `*.apiculture.example` hosts in the contracts are documentation defaults, not live services.

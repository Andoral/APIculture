---
title: API Reference
description: Where the reference lives, how it is produced, and how to use the machine-readable spec.
---

The reference is generated from the OpenAPI 3.1 document in [`openapi/v1/openapi.yaml`](https://github.com/Andoral/APIculture/blob/main/openapi/v1/openapi.yaml). The same document drives the interactive pages, the SDKs and the sandbox mock server, so what you read here is exactly what the API accepts.

| Version | Status | Interactive reference | OpenAPI document |
| --- | --- | --- | --- |
| v1 | stable | [Open reference](/reference/v1/) | [`/openapi/v1.yaml`](/openapi/v1.yaml) |

## Using the interactive reference

- The left column lists endpoints grouped by tag; the right column shows request examples in curl, JavaScript, Python, Go and more.
- **Test request** opens a client in the browser. Paste a sandbox key (`ak_test_…`) into the `Authorization` field; requests go to the sandbox server by default.
- Every schema and enum is browsable under **Models**.

## Using the OpenAPI document directly

```bash
# generate a typed TypeScript client
npx openapi-typescript https://docs.apiculture.example/openapi/v1.yaml -o apiculture.d.ts

# run a local mock server that answers with the examples from the spec
npx @stoplight/prism-cli mock https://docs.apiculture.example/openapi/v1.yaml
```

The document is validated in CI with [Spectral](https://github.com/stoplightio/spectral) using the ruleset in [`.spectral.yaml`](https://github.com/Andoral/APIculture/blob/main/.spectral.yaml): every operation must have a summary, a description, documented error responses, and consistent naming. A change to the API that lacks documentation cannot be merged.

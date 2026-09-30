---
title: SDKs & tools
description: Official client libraries and tools generated from the OpenAPI document.
---

:::note
SDKs are generated from the same [OpenAPI document](/reference/) that powers this site. Method names follow the `operationId` of each endpoint (`listApiaries`, `createHive`, …), so the reference doubles as the SDK documentation.
:::

## Official SDKs

| Language | Package | Status |
| --- | --- | --- |
| TypeScript / JavaScript | `@apiculture/sdk` | planned |
| Python | `apiculture` | planned |
| Go | `github.com/apiculture/apiculture-go` | planned |

Until an SDK is published for your language, generate a client yourself:

```bash
# TypeScript types only (zero runtime)
npx openapi-typescript https://docs.apiculture.example/openapi/v1.yaml -o apiculture.d.ts

# Full client for any language supported by OpenAPI Generator
npx @openapitools/openapi-generator-cli generate \
  -i https://docs.apiculture.example/openapi/v1.yaml -g python -o ./apiculture-python
```

## Tools

- **Mock server** — `npx @stoplight/prism-cli mock https://docs.apiculture.example/openapi/v1.yaml` answers every endpoint with the examples from the spec. Useful for frontend work and CI without a sandbox key.
- **Postman / Insomnia / Bruno** — import `https://docs.apiculture.example/openapi/v1.yaml` directly.
- **Contract tests** — validate your recorded responses against the schema with any JSON Schema 2020-12 validator.

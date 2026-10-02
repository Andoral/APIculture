---
title: SDKs & tools
description: Official client libraries and tools generated from each style's contract.
---

:::note
Official packaged SDKs are not published yet. Until they are, generate a client from the contract of the style you use. Method names follow REST `operationId`s (`listApiaries`, `createHive`, …) in REST, JSON-RPC and the corresponding SOAP / gRPC / GraphQL names.
:::

## Official SDKs

| Language | Package | Status |
| --- | --- | --- |
| TypeScript / JavaScript | `@apiculture/sdk` | planned |
| Python | `apiculture` | planned |
| Go | `github.com/apiculture/apiculture-go` | planned |

Generate a client yourself from the [specifications catalog](/reference/):

```bash
# REST — TypeScript types only (zero runtime)
npx openapi-typescript http://127.0.0.1:4321/specs/rest/v1.yaml -o apiculture.d.ts

# REST — full client for any language OpenAPI Generator supports
npx @openapitools/openapi-generator-cli generate \
  -i http://127.0.0.1:4321/specs/rest/v1.yaml -g python -o ./apiculture-python

# gRPC stubs
protoc --go_out=. --go-grpc_out=. specs/grpc/v1/apiculture.proto

# GraphQL types
npx graphql-codegen --schema specs/graphql/v1/schema.graphql

# SOAP — import specs/soap/v1/apiculture.wsdl into your stack's stub generator
```

## Tools

- **Local sandbox** — `npm run sandbox` serves REST, SOAP, JSON-RPC, GraphQL and WebSocket from one in-memory store. See [Local sandbox](/getting-started/sandbox/).
- **Prism mock** — `npx @stoplight/prism-cli mock specs/rest/v1/openapi.yaml` answers every REST endpoint with the examples from the spec (no persistence). Useful in CI when you do not need writes to stick.
- **Postman / Insomnia / Bruno** — import [`/specs/rest/v1.yaml`](/specs/rest/v1.yaml) directly.
- **Contract tests** — validate recorded REST responses against the schema with any JSON Schema 2020-12 validator.

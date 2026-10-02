---
title: Specifications
description: Machine-readable contracts for every APIculture API style, and where each interactive reference lives.
---

Each style has its own contract in `specs/`. The site serves that file as a static download; human-readable and interactive references are generated from it, not rewritten as a second source of truth.

| Style | Contract in git | Download | Human-readable | Interactive |
| --- | --- | --- | --- | --- |
| REST | [`openapi.yaml`](https://github.com/Andoral/APIculture/blob/main/specs/rest/v1/openapi.yaml) | [`/specs/rest/v1.yaml`](/specs/rest/v1.yaml) | [REST](/rest/) | [Scalar](/reference/rest/v1/) |
| SOAP | [`apiculture.wsdl`](https://github.com/Andoral/APIculture/blob/main/specs/soap/v1/apiculture.wsdl) | [`/specs/soap/v1.wsdl`](/specs/soap/v1.wsdl) | [Operations](/soap/reference/) | — |
| JSON-RPC | [`openrpc.json`](https://github.com/Andoral/APIculture/blob/main/specs/rpc/v1/openrpc.json) | [`/specs/rpc/v1.json`](/specs/rpc/v1.json) | [Methods](/rpc/reference/) | — |
| gRPC | [`apiculture.proto`](https://github.com/Andoral/APIculture/blob/main/specs/grpc/v1/apiculture.proto) | [`/specs/grpc/v1.proto`](/specs/grpc/v1.proto) | [Services](/grpc/reference/) | — |
| GraphQL | [`schema.graphql`](https://github.com/Andoral/APIculture/blob/main/specs/graphql/v1/schema.graphql) | [`/specs/graphql/v1.graphql`](/specs/graphql/v1.graphql) | [Schema](/graphql/reference/) | — |
| WebSocket | [`asyncapi.yaml`](https://github.com/Andoral/APIculture/blob/main/specs/websocket/v1/asyncapi.yaml) | [`/specs/websocket/v1.yaml`](/specs/websocket/v1.yaml) | [Channels](/websocket/reference/) | [Scalar](/reference/websocket/v1/) |

CI runs `npm run lint:specs`: Spectral on REST OpenAPI (`.spectral.yaml`) plus structural checks for WSDL, OpenRPC, proto, GraphQL SDL and AsyncAPI.

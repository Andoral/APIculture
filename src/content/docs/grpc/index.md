---
title: gRPC
description: gRPC API documented from Protocol Buffers.
---

gRPC exposes the same domain as four services in package `apiculture.v1`. The machine-readable contract is the `.proto` file — generate stubs with `buf` or `protoc`, call the sandbox with `grpcurl`.

| | |
| --- | --- |
| **Contract** | [`specs/grpc/v1/apiculture.proto`](https://github.com/Andoral/APIculture/blob/main/specs/grpc/v1/apiculture.proto) · [`/specs/grpc/v1.proto`](/specs/grpc/v1.proto) |
| **Reference** | [Services](/grpc/reference/) |
| **Host** | `sandbox.api.apiculture.example:443` (TLS). The [local sandbox](/getting-started/sandbox/) does not speak gRPC. |

[Quickstart](/grpc/quickstart/) · [Authentication](/getting-started/authentication/) · [REST equivalent](/rest/)

There is no browser Try-it. Use `grpcurl` or a generated client from your backend.

## Conventions

- Protocol Buffers 3, gRPC over HTTP/2 + TLS.
- Metadata: `authorization: Bearer ak_…` (lowercase key, gRPC convention).
- Field names in proto are snake_case; generated code maps them to the language idiom.
- Enums have an `_UNSPECIFIED = 0` value; never send it.
- `next_cursor` is an empty string when there is no further page (proto3 has no `null`).
- Idempotency is a field on create requests (`idempotency_key`), not a header.

## Status codes

| gRPC status | `google.rpc.ErrorInfo.reason` | REST analogue |
| --- | --- | --- |
| `UNAUTHENTICATED` | `UNAUTHENTICATED` | 401 |
| `NOT_FOUND` | `NOT_FOUND` | 404 |
| `FAILED_PRECONDITION` | `APIARY_NOT_EMPTY` | 409 |
| `INVALID_ARGUMENT` | `VALIDATION_FAILED` | 422 |
| `ALREADY_EXISTS` | `IDEMPOTENCY_KEY_REUSED` | 422 |
| `RESOURCE_EXHAUSTED` | `RATE_LIMITED` | 429 |

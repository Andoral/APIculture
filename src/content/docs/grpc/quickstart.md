---
title: Quickstart
description: Create an apiary over gRPC with grpcurl.
sidebar:
  order: 1
---

You need a sandbox key (`ak_test_…`) — see [Authentication](/getting-started/authentication/). [`grpcurl`](https://github.com/fullstorydev/grpcurl) can reflect or load the proto from this site.

## 1. List apiaries

```bash
grpcurl -proto apiculture.proto \
  -H 'authorization: Bearer ak_test_REPLACE_ME' \
  -d '{"limit": 20}' \
  sandbox.api.apiculture.example:443 \
  apiculture.v1.ApiaryService/ListApiaries
```

Download the proto from [`/specs/grpc/v1.proto`](/specs/grpc/v1.proto) (save as `apiculture.proto`). A fresh account returns `{ "data": [] }`.

## 2. Create an apiary

```bash
grpcurl -proto apiculture.proto \
  -H 'authorization: Bearer ak_test_REPLACE_ME' \
  -d '{
    "name": "Orchard apiary",
    "location": { "latitude": 55.7558, "longitude": 37.6173 },
    "idempotency_key": "5f2c7a4e-2f1e-4c1a-9d1e-0c1d2e3f4a5b"
  }' \
  sandbox.api.apiculture.example:443 \
  apiculture.v1.ApiaryService/CreateApiary
```

## 3. Read it back

```bash
grpcurl -proto apiculture.proto \
  -H 'authorization: Bearer ak_test_REPLACE_ME' \
  -d '{"apiary_id": "ap_01J8Z5N6K8Q2X3W4V5B6C7D8E9"}' \
  sandbox.api.apiculture.example:443 \
  apiculture.v1.ApiaryService/GetApiary
```

## Generate a client

```bash
# example: Go
buf generate https://docs.apiculture.example/specs/grpc/v1.proto
```

## Next steps

- [Service reference](/grpc/reference/)
- [Architecture & concepts](/)

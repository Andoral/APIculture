---
title: Quickstart
description: Create an apiary over SOAP in a few requests.
sidebar:
  order: 1
---

Same walkthrough as REST, as SOAP envelopes. You need a sandbox key (`ak_test_…`) — see [Authentication](/getting-started/authentication/).

## 1. List apiaries

```bash
curl http://127.0.0.1:8787/soap/v1 \
  -H "Authorization: Bearer ak_test_local" \
  -H "Content-Type: text/xml; charset=utf-8" \
  -H "SOAPAction: https://api.apiculture.example/soap/v1/ListApiaries" \
  --data-binary @- <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ListApiaries xmlns="https://api.apiculture.example/soap/v1">
      <limit>20</limit>
    </ListApiaries>
  </soap:Body>
</soap:Envelope>
EOF
```

A fresh account returns an empty list (`<apiary>` elements absent, `<nextCursor>` nil).

## 2. Create an apiary

```xml
<CreateApiary xmlns="https://api.apiculture.example/soap/v1">
  <name>Orchard apiary</name>
  <location>
    <latitude>55.7558</latitude>
    <longitude>37.6173</longitude>
  </location>
  <idempotencyKey>5f2c7a4e-2f1e-4c1a-9d1e-0c1d2e3f4a5b</idempotencyKey>
</CreateApiary>
```

Use `SOAPAction: …/CreateApiary`. The response body contains the new `<apiary>` with `id` `ap_…`.

## 3. Read it back

```xml
<GetApiary xmlns="https://api.apiculture.example/soap/v1">
  <apiaryId>ap_01J8Z5N6K8Q2X3W4V5B6C7D8E9</apiaryId>
</GetApiary>
```

## Next steps

- Every operation: [SOAP reference](/soap/reference/).
- Domain model: [Architecture & concepts](/).
- HTTP JSON form of the same calls: [REST](/rest/).

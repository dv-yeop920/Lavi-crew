# 012. Kakao Alimtalk outbox processor

## RADIO

- **Requirements:** schedule confirmation, change, and cancellation transactions continue to create
  durable pending notification rows. A bearer-protected internal processor claims due rows and
  sends only to active recipients who currently consent and have a valid Korean mobile number.
  Delivery is retried at most three times. Missing server/provider configuration fails before any
  row is claimed. The live provider certification remains blocked until credentials, sender
  profile, and approved template codes are supplied.
- **Architecture:** schedule RPCs write the outbox inside their database transaction and never call
  the external provider. `POST /api/internal/notifications/process` verifies `CRON_SECRET`, then a
  Controller coordinates a service-role Repository and a Kakao Adapter. The Repository can mutate
  the outbox only through three `SECURITY DEFINER` RPCs. The Adapter uses native server-side
  `fetch`, an `AbortController` timeout, and per-notification idempotency. Claims are capped at five
  and sent concurrently; each completion/retry failure is isolated and counted rather than
  aborting the batch. No provider or service secret has a `NEXT_PUBLIC_` prefix.
- **Data:** `attempt_count`, `next_attempt_at`, `last_attempt_at`, lease timestamps/token, and safe
  `error_code` extend the existing log. Claim increments attempts and establishes a bounded lease
  under `FOR UPDATE SKIP LOCKED`. Completion and retry compare the lease token. Transient failures
  back off for one and then two minutes; the third attempt and permanent failures transition to
  `failed`. If a processor crashes after claiming the third attempt, the next claim terminally
  closes the expired lease with `ERROR_RETRY_EXHAUSTED`. Existing pending rows are backfilled as
  immediately due.
- **Interfaces:** claim returns only notification ID, lease token, type, normalized phone, recipient
  name, and schedule date/times. The provider request is `POST` with bearer authorization,
  `X-Idempotency-Key`, and the JSON contract below. A successful provider response is exactly
  `{ "success": true, "messageId": "..." }`; provider failure responses may supply
  `{ "success": false, "error": { "code": "...", "retryable": true } }`. Processor HTTP responses
  expose aggregate counts or stable safe codes, never recipients, provider bodies, keys, or tokens.
- **Optimization and observability:** a partial due-delivery index supports bounded claims.
  Processor results expose claimed/sent/retried/failed/error counts. Provider timeout is at most 15
  seconds, leases are 60-300 seconds, and the lease must exceed the timeout by more than a
  45-second execution margin. The five requests run concurrently, keeping provider wait inside the
  Route execution budget. Persisted errors are bounded, sanitized codes and fixed safe reasons.
  Tests cover crash recovery, configuration bounds, per-item failure isolation, classification,
  adapter requests/responses, repository schema validation, cron authorization, and static SQL
  security/concurrency invariants.

## Provider HTTP contract

Request headers:

```text
Authorization: Bearer <KAKAO_ALIMTALK_API_KEY>
Content-Type: application/json
X-Idempotency-Key: <notification UUID>
```

Request body:

```json
{
  "requestId": "notification UUID",
  "senderKey": "provider sender profile key",
  "templateCode": "type-specific approved template code",
  "recipientPhone": "01012345678",
  "variables": {
    "recipientName": "홍길동",
    "workDate": "2026-08-01",
    "startTime": "09:00",
    "endTime": "18:00",
    "type": "schedule_confirmed"
  }
}
```

The selected provider must certify this request/response mapping and guarantee idempotency for a
stable request ID before live traffic is enabled. HTTP 408, 425, 429, 5xx, timeouts, network errors,
and explicitly retryable provider failures are transient. Other 4xx responses are permanent. Raw
provider messages are deliberately discarded.

## Access matrix

| Actor | Read notification logs | Direct CUD | Processor RPC |
| --- | --- | --- | --- |
| Worker | Own rows under active-membership RLS | Denied | Denied |
| Admin | All rows under active-admin RLS | Denied | Denied |
| anon/authenticated | As above only when a select policy permits | Denied | Denied |
| service role | Server-side operational use | Denied | Claim/complete/retry only |

Each processor RPC is `SECURITY DEFINER` with an empty search path, explicit schema qualification,
and execute revoked from `PUBLIC`, `anon`, and `authenticated`.

## Recovery, rollout, and rollback

Apply `20260730122011_notification_outbox_processor.sql` after the schedule and notice migrations,
then configure secrets and perform provider sandbox certification before enabling the cron call.
Stopping cron is the safe operational rollback: pending rows remain durable and expired leases
below the attempt limit become claimable. An expired third-attempt lease becomes a terminal failed
audit row on the next processor invocation rather than remaining stranded. A schema rollback must
first stop processors and preserve the delivery audit; dropping retry columns would discard
operational history and is not an automatic rollback.

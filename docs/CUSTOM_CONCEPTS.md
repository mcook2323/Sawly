# Sawly custom concepts

Custom concepts are deployment-controlled. With the default `SAWLY_AI_MODE=deterministic`, unsupported ideas remain saveable but concept text and image generation controls are not shown. Set `SAWLY_AI_MODE=openai` to enable the existing server-side providers.

## Product boundary

Outdoor Table and Outdoor Bench remain Verified Sawly Plans produced by deterministic calculation engines. Every other generated direction is labeled **AI Concept — Not Yet Build-Verified**. Concepts support discovery and visual exploration only; they are not certified plans and contain no exact cut lists, load ratings, structural claims, code assurances, or electrical, plumbing, and gas instructions.

## Architecture

`POST /api/design/concepts` validates and rate-limits a request, asks the server-only OpenAI provider for exactly three strict structured concepts, and returns immediately after text validation. `POST /api/design/concepts/image` generates one concept image independently. The workspace makes “Generate selected image” the low-cost default action and offers an explicit concurrent “Generate all three images” action. No image request starts automatically. Text survives every image failure.

The text provider uses the Responses API with strict JSON Schema. The image provider uses the official Images API. `CustomConceptProvider`, `ConceptImageProvider`, and `ConceptImageStorage` keep application contracts independent of OpenAI and local disk.

## Environment

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
OPENAI_IMAGE_MODEL=gpt-image-1-mini
OPENAI_CONCEPT_TIMEOUT_MS=45000
SAWLY_DAILY_CONCEPT_LIMIT=10
SAWLY_DAILY_IMAGE_LIMIT=30
SAWLY_CONCEPT_CACHE_TTL_MS=300000
```

Copy `.env.example` to `.env.local`, add a real key, and restart the server. No provider request is made when the key is absent, and Sawly does not fabricate fallback concepts or images.

## Image storage

Development images are written through `ConceptImageStorage` to `public/generated/concepts` and referenced by URL. Base64 payloads never enter browser storage. This local adapter is not durable on serverless or multi-instance production systems. Replace it with S3, Cloudflare R2, Supabase Storage, or equivalent object storage before deployment.

## Persistence

The active package and per-image metadata are kept in localStorage so refresh can immediately restore concept text, ready image references, status, retry count, and last-attempt timestamp. Interrupted `generating` states reopen as explicit failed/retry states; Sawly never automatically repeats the image request. Explicit saves use versioned localStorage metadata under `sawly.custom-concepts.v1`, separate from Saved Projects, Saved Ideas, and conversation snapshots. Saved records support reopen, duplicate, delete, and malformed-record filtering.

## Limits and costs

Concept and image routes have separate per-IP and per-session rolling limits, daily caps, body limits, and provider-specific timeouts. One concept-text job may run per browser session. Short-lived idempotency caching and shared in-flight promises prevent duplicate provider calls. Image jobs are locked by package and concept, so different concepts can render concurrently while duplicate calls for the same job reuse one result. The UI and server permit at most three attempts per concept and never regenerate a successful image automatically.

Server logs record request IDs and separate concept-text, image, and preparation latency categories without complete prompts. `SAWLY_CONCEPT_CACHE_TTL_MS` controls short-lived reuse and defaults to five minutes.

The current in-memory counters and active-job sets are local-process protections only. Production requires distributed atomic rate limiting and job locks using Redis, Upstash, or similar shared infrastructure, plus provider budgets and monitoring.

## Known limitations

- Local image files are not durable across deployments.
- In-memory idempotency caches and job sharing are process-local; production requires distributed storage and locks.
- Browser metadata is device-specific and has no account sync.
- AI concepts require human dimensional, structural, trade, and safety review.
- Natural-language revision currently returns a refreshed structured direction and may require an optional image retry.

# Sawly custom concepts

## Product boundary

Outdoor Table and Outdoor Bench remain Verified Sawly Plans produced by deterministic calculation engines. Every other generated direction is labeled **AI Concept — Not Yet Build-Verified**. Concepts support discovery and visual exploration only; they are not certified plans and contain no exact cut lists, load ratings, structural claims, code assurances, or electrical, plumbing, and gas instructions.

## Architecture

`POST /api/design/concepts` validates and rate-limits a request, asks the server-only OpenAI provider for exactly three strict structured concepts, and then attempts one image per concept. `POST /api/design/concepts/image` retries one concept image independently. Text survives every image failure.

The text provider uses the Responses API with strict JSON Schema. The image provider uses the official Images API. `CustomConceptProvider`, `ConceptImageProvider`, and `ConceptImageStorage` keep application contracts independent of OpenAI and local disk.

## Environment

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-nano
OPENAI_IMAGE_MODEL=gpt-image-1-mini
SAWLY_DAILY_CONCEPT_LIMIT=10
SAWLY_DAILY_IMAGE_LIMIT=30
```

Copy `.env.example` to `.env.local`, add a real key, and restart the server. No provider request is made when the key is absent, and Sawly does not fabricate fallback concepts or images.

## Image storage

Development images are written through `ConceptImageStorage` to `public/generated/concepts` and referenced by URL. Base64 payloads never enter browser storage. This local adapter is not durable on serverless or multi-instance production systems. Replace it with S3, Cloudflare R2, Supabase Storage, or equivalent object storage before deployment.

## Persistence

The active package is kept in session storage for navigation. Explicit saves use versioned localStorage metadata under `sawly.custom-concepts.v1`, separate from Saved Projects, Saved Ideas, and conversation snapshots. Saved records support reopen, duplicate, delete, and malformed-record filtering.

## Limits and costs

Concept and image routes have separate per-IP and per-session rolling limits, daily caps, duplicate suppression, one active job per session, timeouts, body limits, and a maximum of three images per concept package. The image route allows only one retry job per session at a time.

The current in-memory counters and active-job sets are local-process protections only. Production requires distributed atomic rate limiting and job locks using Redis, Upstash, or similar shared infrastructure, plus provider budgets and monitoring.

## Known limitations

- Local image files are not durable across deployments.
- Browser metadata is device-specific and has no account sync.
- AI concepts require human dimensional, structural, trade, and safety review.
- Natural-language revision currently returns a refreshed structured direction and may require an optional image retry.

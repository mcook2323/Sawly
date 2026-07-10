# Sawly AI conversation provider

## Architecture

`POST /api/design/conversation` is the only browser-facing AI boundary. It validates and rate-limits requests before selecting a provider. `OpenAIConversationProvider` uses the official OpenAI JavaScript SDK and Responses API on the server. `resolveWithProvider` converts provider guidance back into Sawly's provider-neutral contracts. Deterministic parsing, question selection, matching, and the Table/Bench generators remain authoritative.

The provider may extract intent, improve clarification wording, and explain discovery recommendations. It cannot create calculations, cut lists, load ratings, engineering claims, trade plans, or code-compliance assurances. Unsupported projects remain saveable ideas, not build-ready plans.

## Environment

Copy `.env.example` to `.env.local` and set:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.4-nano
```

Create an API key in the OpenAI platform dashboard. Never commit the key. `.env.local` is ignored by Git, and no `NEXT_PUBLIC_` key is used. Restart the development server after changing environment variables.

`OPENAI_MODEL` is optional. The default is `gpt-5.4-nano`, selected for cost-conscious classification and structured extraction. The environment variable keeps the product independent of a permanent model choice.

## Structured output and fallback

The Responses API is constrained with a strict JSON Schema. A separate runtime validator rejects malformed values, unexpected fields, unsupported template IDs, and construction-math fields. Model output never directly enters a generator.

Sawly automatically uses deterministic guidance when the key is missing, the provider times out, the response is malformed, or the provider fails. The UI labels AI-enhanced versus verified fallback guidance. Rate-limited requests retain deterministic client guidance and expose a retry action.

## Rate limits and cost controls

The local limiter applies per-IP and per-browser-session rolling limits, a daily cap, rapid duplicate suppression, prompt/body limits, an 8-second provider timeout, and a 900-token output cap. Responses are not cached.

The limiter is intentionally in-memory and is not globally durable across processes, deployments, or serverless instances. Production must replace the `RateLimiter` implementation with shared storage such as Redis or Upstash, using atomic counters and expirations. Authentication-independent abuse controls, budget alerts, and provider usage dashboards should also be configured before broad release.

## Observability and privacy

Server logs contain timestamp, request ID, outcome category, latency, fallback use, and rate-limit events. They do not contain API keys, full prompts, conversation histories, or raw provider responses. The logger is a small replaceable boundary for future monitoring.

## Supported capabilities

- Intent and requirement extraction
- Follow-up question wording
- Verified Outdoor Table and Outdoor Bench discovery
- Honest unsupported-project explanations

## Unsupported capabilities

- Arbitrary construction plans or cut lists
- Structural certification or load ratings
- Electrical, plumbing, or gas plans
- Permit or code-compliance assurances
- Replacing deterministic project calculations

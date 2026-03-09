# Scan Card API — Next.js Implementation Spec

## Overview

The iOS app currently calls the Claude and OpenAI APIs directly from the device, which
means the API keys are embedded in the app binary and can be extracted by anyone. This
spec moves those calls server-side so the keys stay in `.env.local` and never ship in
the app.

The iOS app already has an `API_BASE_URL` (`https://helixcard.app/api`) and an `API_KEY`
it uses for authenticated backend calls. This new endpoint follows the same pattern.

---

## Environment Variables

Add the following to `.env.local` (both are already present):

```
CLAUDE_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
INTERNAL_API_KEY=mAac0+ehh2UKYKqz4a5s9toOgxC6luZqnRngkZffTXQ=
```

`INTERNAL_API_KEY` is the shared secret the iOS app sends in the `x-api-key` header to
authenticate requests to your own API. It matches the `API_KEY` value in the iOS app's
`Config.xcconfig`.

---

## New Endpoint

### `POST /api/scan-card`

#### Authentication

Every request from the iOS app includes:

```
x-api-key: <INTERNAL_API_KEY>
```

Reject with **401** if the header is missing or does not match `process.env.INTERNAL_API_KEY`.

#### Request Body

```json
{
  "text": "raw OCR text extracted from the scanned business card image",
  "provider": "openai"
}
```

| Field      | Type   | Required | Values              | Description                                      |
|------------|--------|----------|---------------------|--------------------------------------------------|
| `text`     | string | yes      | any non-empty string| Raw text extracted by the iOS Vision framework   |
| `provider` | string | yes      | `"openai"`, `"claude"` | Which AI provider to use for this request     |

Reject with **400** if `text` is missing/empty or `provider` is not one of the accepted values.

#### Behaviour

> **Important:** The iOS app controls the fallback order — it tries OpenAI first, and if
> that fails it calls this endpoint again with `provider: "claude"`. **Do not implement
> your own fallback inside the route.** Just use whichever provider is specified.

**When `provider` is `"openai"`**, call:

```
POST https://api.openai.com/v1/chat/completions
Authorization: Bearer <OPENAI_API_KEY>
Content-Type: application/json

{
  "model": "gpt-4o-mini",
  "temperature": 0.3,
  "messages": [
    {
      "role": "system",
      "content": "You are a precise business card information extractor."
    },
    {
      "role": "user",
      "content": "<PROMPT — see below>"
    }
  ]
}
```

**When `provider` is `"claude"`**, call:

```
POST https://api.anthropic.com/v1/messages
x-api-key: <CLAUDE_API_KEY>
anthropic-version: 2023-06-01
Content-Type: application/json

{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "<PROMPT — see below>"
    }
  ]
}
```

#### The Prompt

Use this prompt for **both** providers (substitute `{text}` with the value from the
request body):

```
You are an AI designed to extract and organize information from text. The text will be either a business card or a tradeshow badge. Extract key details from this business card text and present them in a structured format. Also some general rules:
 - do not include prefixes like "Mr.", "Ms.", "Dr.", etc. Names should just start with the first name. You can include suffixes like "Jr.", "Sr.", "III", pharmd, md, bsn, rn, md, etc.
 - if multiple phone numbers are found, prioritize cell/mobile numbers. Then office numbers if no cell. Definitely dont want fax numbers. But only extract one phone number.
 - if a website is not present, but an email address is, we can assume the domain from the email address is the website.
 - do not include registered trademark symbols.
 - phone numbers should be in the format of (123) 456-7890
 - Ensure that all caps text is converted to proper upper and lower case formatting for a clean appearance, while preserving accurate capitalization for company names and personal names. However, do not alter someone's credentials e.g. PharmD, MD, BSN, RN, CPhT, etc.

{text}

Return only a JSON object with these fields:
{
  "name": "Full Name",
  "position": "Job Title",
  "company": "Company Name",
  "phone": "Phone Number",
  "email": "Email Address",
  "address": "Full Address",
  "website": "Website URL"
}
```

#### Successful Response — 200

Return **exactly** this JSON shape (the iOS app decodes directly into this struct):

```json
{
  "name": "John Smith",
  "position": "VP of Sales",
  "company": "Acme Corp",
  "phone": "(555) 123-4567",
  "email": "john@acme.com",
  "address": "123 Main St, New York, NY 10001",
  "website": "acme.com"
}
```

All fields must be present even if empty (use `""` for missing values). The iOS app
expects all seven keys — missing keys will cause a decoding error.

#### Error Responses

| Status | When                                              |
|--------|---------------------------------------------------|
| 400    | `text` missing/empty or `provider` invalid        |
| 401    | `x-api-key` header missing or incorrect           |
| 429    | Upstream AI provider returned rate limit error    |
| 500    | Any other upstream failure (log server-side, return generic message to client) |

For 500 errors, return:
```json
{ "error": "Failed to process business card. Please try again." }
```

---

## Rate Limiting (recommended)

The iOS app already has a client-side rate limiter (20 req/min). Add server-side rate
limiting per IP as a second layer. Suggested: **upstash/ratelimit** if deployed on
Vercel, or a simple in-memory counter otherwise.

---

## Example Route File Locations

- **App Router:** `app/api/scan-card/route.ts`
- **Pages Router:** `pages/api/scan-card.ts`

---

## After Deployment

Once this endpoint is live and tested, let the iOS developer know so they can:

1. Rotate the `CLAUDE_API_KEY` and `OPENAI_API_KEY` values (generate new keys from the
   Anthropic and OpenAI dashboards)
2. Update `Config.xcconfig` with the new keys **only** in `.env.local` — they no longer
   need to be in `Config.xcconfig` at all and can be removed from that file
3. Submit an app update (the `Info.plist` changes removing the keys from the binary are
   already done on the iOS side)

---

## Testing the Endpoint

A quick `curl` to verify it's working before the iOS app is updated:

```bash
curl -X POST https://helixcard.app/api/scan-card \
  -H "Content-Type: application/json" \
  -H "x-api-key: mAac0+ehh2UKYKqz4a5s9toOgxC6luZqnRngkZffTXQ=" \
  -d '{
    "text": "John Smith\nVP of Sales\nAcme Corp\njohn@acme.com\n(555) 123-4567\nacme.com",
    "provider": "openai"
  }'
```

Expected response:
```json
{
  "name": "John Smith",
  "position": "VP of Sales",
  "company": "Acme Corp",
  "phone": "(555) 123-4567",
  "email": "john@acme.com",
  "address": "",
  "website": "acme.com"
}
```

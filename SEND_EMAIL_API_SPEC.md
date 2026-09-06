# Send Email API — iOS Implementation Spec

## What changed

`POST /api/send-email` still accepts the same request from iOS and web.
**You do not need to change the URL, headers, or JSON body.**

What changed on the server:

- Delivery moved from **Gmail / nodemailer** to **Resend**
- Mail now comes from the Helix domain
  (`HelixCard <hello@mail.helixcard.app>`, or `RESEND_FROM_EMAIL`)
- Card-share and CSV-export emails now use the same sender as welcome /
  verification mail

This is a different endpoint from `POST /api/auth/email` (welcome, verify,
password reset). See `AUTH_EMAIL_API_SPEC.md` for that one.

This endpoint is already live. After this deploy, the same iOS calls send
through Resend.

---

## Endpoint

```
POST https://www.helixcard.app/api/send-email
```

`https://helixcard.app/api/send-email` is also fine if that is the app’s
existing `API_BASE_URL`.

`Content-Type` is always `application/json`.

---

## Authentication

| `type`         | Auth required | Header |
|----------------|---------------|--------|
| `businessCard` | No            | optional |
| `csvExport`    | Yes           | `Authorization: Bearer <token>` |

For `csvExport`, the Bearer token can be either:

1. A **Firebase ID token** for the signed-in user, or
2. The iOS **`IOS_API_KEY`** (the same shared secret the app already uses)

```
Authorization: Bearer <Firebase ID token>
```

or

```
Authorization: Bearer <IOS_API_KEY>
```

This is **not** the `x-api-key` header used by `POST /api/scan-card`. Send the
key as a Bearer token here.

If `csvExport` is missing a valid token, the API returns **401**
`{ "error": "Authentication required" }`.

---

## Share a business card — `{ "type": "businessCard" }`

Public share. No auth required.

### Request

```http
POST /api/send-email
Content-Type: application/json

{
  "type": "businessCard",
  "email": "recipient@example.com",
  "cardUrl": "https://www.helixcard.app/c/username",
  "cardOwner": "Ada",
  "note": "Great meeting you today",
  "ownerEmail": "ada@example.com"
}
```

| Field        | Type   | Required | Description |
|--------------|--------|----------|-------------|
| `type`       | string | yes      | `"businessCard"` |
| `email`      | string | yes      | Recipient address |
| `cardUrl`    | string | yes      | Public card URL. Must be `http` or `https`. |
| `cardOwner`  | string | no       | First name shown in the subject and body |
| `note`       | string | no       | Optional message included in the email |
| `ownerEmail` | string | no       | If present, used as Reply-To so the recipient can reply to the card owner |

### What the server does

- Sends via Resend
- Subject: `Here is {cardOwner}'s business card`
- Includes a **View Business Card** button for `cardUrl`
- Sets Reply-To to `ownerEmail` when it is a valid address

### Successful response — 200

```json
{ "success": true }
```

---

## Contacts CSV export — `{ "type": "csvExport" }`

Requires auth. iOS should keep sending the CSV it already builds.

Web does this in two steps (`POST /api/contacts/export` builds the CSV, then
calls this endpoint). iOS can keep calling `/api/send-email` directly.

### Request

```http
POST /api/send-email
Authorization: Bearer <Firebase ID token or IOS_API_KEY>
Content-Type: application/json

{
  "type": "csvExport",
  "email": "user@example.com",
  "csvData": "Full Name,First Name,Last Name,...\n\"Ada Lovelace\",\"Ada\",\"Lovelace\",...",
  "fileName": "helix-contacts-export-2026-09-06.csv"
}
```

| Field      | Type   | Required | Description |
|------------|--------|----------|-------------|
| `type`     | string | yes      | `"csvExport"` |
| `email`    | string | yes      | Where to send the export |
| `csvData`  | string | yes      | Raw CSV text (UTF-8). Do **not** base64-encode it. The server attaches it. |
| `fileName` | string | no       | Attachment name. Should end in `.csv`. Unsafe names fall back to `helix-card-export.csv`. |

### What the server does

- Sends via Resend
- Subject: `Your Helix Contacts Export`
- Attaches the CSV as a file
- Body: “Your requested contacts export from Helix is attached to this email as a CSV file.”

### Successful response — 200

```json
{ "success": true }
```

---

## Error responses

| Status | When |
|--------|------|
| 400 | Invalid `type`, invalid recipient email, or missing/empty `csvData` |
| 401 | `csvExport` without a valid Bearer token |
| 429 | Rate limited (see below) |
| 500 | Send failed (Resend or unexpected server error) |
| 503 | `RESEND_API_KEY` is not configured in that environment |

Error body is JSON, for example:

```json
{ "error": "Authentication required" }
```

```json
{ "error": "Failed to send email" }
```

---

## Rate limits

Keep existing client-side throttling. Server-side:

- Unauthenticated: 5 requests / minute / IP, plus a shared hourly/daily quota
- Authenticated: 20 requests / minute / IP, plus a higher hourly/daily quota

A **429** means wait and retry. If `Retry-After` is present, honor it.

---

## What iOS should do

1. Keep calling `POST /api/send-email` with the same JSON as today.
2. Keep sending `csvExport` with a Bearer token (`IOS_API_KEY` or Firebase ID token).
3. Keep sending `csvData` as a plain CSV string, not base64.
4. Do not switch this traffic to `/api/auth/email`.
5. After deploy, confirm mail arrives from Resend, not Gmail.

No app-store / request-shape change is required for this migration.

---

## How to confirm it still works

### Card share

Send a test `businessCard` request and check:

1. API returns `{ "success": true }`
2. Mail arrives from `HelixCard <hello@mail.helixcard.app>` (or configured from)
3. Subject is `Here is {name}'s business card`
4. The button opens the card URL
5. Reply goes to `ownerEmail` when that field was sent

### CSV export

Export contacts from the iOS app and check:

1. API returns `{ "success": true }`
2. Mail arrives from the same Resend from-address
3. Subject is `Your Helix Contacts Export`
4. The CSV attachment opens and has the expected rows

---

## Examples

```bash
# Share a card
curl -X POST https://www.helixcard.app/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "businessCard",
    "email": "recipient@example.com",
    "cardUrl": "https://www.helixcard.app/c/ada",
    "cardOwner": "Ada",
    "ownerEmail": "ada@example.com"
  }'
```

```bash
# Export contacts (iOS API key or Firebase ID token)
curl -X POST https://www.helixcard.app/api/send-email \
  -H "Authorization: Bearer <IOS_API_KEY_OR_FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "csvExport",
    "email": "user@example.com",
    "csvData": "Full Name,Email\n\"Ada Lovelace\",\"ada@example.com\"",
    "fileName": "helix-contacts-export-2026-09-06.csv"
  }'
```

Expected:

```json
{ "success": true }
```

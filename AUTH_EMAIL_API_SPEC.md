# Auth Email API — iOS Implementation Spec

## What changed

Helix no longer uses Firebase Auth’s built-in email templates for welcome,
verification, password reset, or email-change mail.

The web app now calls our own backend, which:

1. Verifies the user’s Firebase ID token (when required)
2. Builds the branded email from `app/lib/authEmailTemplates.ts`
3. Sends it through **Resend**

The iOS app should do the same. Do **not** rely on Firebase to send these emails,
and do **not** use the `x-api-key` / `INTERNAL_API_KEY` header used by
`POST /api/scan-card`. This endpoint authenticates with a Firebase ID token.

This is a different endpoint from `POST /api/send-email` (card share and CSV
export). See `SEND_EMAIL_API_SPEC.md` for that one.

This endpoint is already live in production.

---

## Endpoint

```
POST https://www.helixcard.app/api/auth/email
```

`https://helixcard.app/api/auth/email` is also fine if that is the app’s existing
`API_BASE_URL`.

`Content-Type` is always `application/json`.

---

## Authentication

| `type`          | Auth required | Header |
|-----------------|---------------|--------|
| `welcome`       | Yes           | `Authorization: Bearer <Firebase ID token>` |
| `verification`  | Yes           | `Authorization: Bearer <Firebase ID token>` |
| `emailChange`   | Yes           | `Authorization: Bearer <Firebase ID token>` |
| `sync`          | Yes           | `Authorization: Bearer <Firebase ID token>` |
| `passwordReset` | No            | none |

The token must belong to the user who just signed up (or the signed-in user
requesting verification / email change). Get a fresh token from Firebase Auth
immediately after signup:

```swift
let idToken = try await user.getIDToken()
```

Then send:

```
Authorization: Bearer <idToken>
Content-Type: application/json
```

If the header is missing, malformed, or the token is invalid, the API returns
**401** `{ "error": "Authentication required" }`.

---

## Welcome email (required for iOS signup)

This is the call that should match web signup.

### When to call it

Call **once**, immediately after a **new** Firebase account is created, for
every signup method:

- Email / password
- Sign in with Apple
- Sign in with Google

Do **not** call it on later logins.

Web behavior:

- Email / password signup: send after `createUserWithEmailAndPassword` succeeds
- Apple / Google: send only when Firebase reports `isNewUser == true`

If the welcome request fails, **signup should still succeed**. Web logs the
error and continues. Treat email as best-effort.

There is no server-side “already sent welcome” guard. Duplicate emails are
prevented only by calling this on first signup.

### Request

```http
POST /api/auth/email
Authorization: Bearer <Firebase ID token>
Content-Type: application/json

{ "type": "welcome" }
```

Do not send `email`, `displayName`, or a destination URL. The server reads those
from the Firebase user on the token.

### What the server does

- Sends to the signed-in user’s email via Resend
- Subject: `Welcome to Helix!`
- Header in the email: `Helix Digital Business Card`
- **Download on the App Store** links to the iOS App Store listing and
  **Get it on Google Play** links to the Play Store listing
- A smaller "manage your cards on the web" link goes to
  `https://www.helixcard.app/dashboard`
- For **email/password** users who are not yet verified, the email also includes
  a **Verify email address** button (web verification page)
- Apple / Google users typically skip that verification block

### Successful response — 200

```json
{ "success": true }
```

---

## Other email types on the same endpoint

Use these if iOS also handles verification, password reset, or email change.
They use the same route and the same Resend templates as web.

### Verify email — `{ "type": "verification" }`

Requires `Authorization: Bearer <Firebase ID token>`.

Sends a verification email to the signed-in user. If they are already verified:

```json
{ "success": true, "alreadyVerified": true }
```

Web only shows this for password-provider users who are not verified.

### Password reset — `{ "type": "passwordReset", "email": "user@example.com" }`

No auth header. The response is always `{ "success": true }` whether or not the
account exists, so the client cannot use this to probe emails.

Only password-provider accounts actually receive a reset email.

### Change email — `{ "type": "emailChange", "newEmail": "new@example.com" }`

Requires `Authorization: Bearer <Firebase ID token>`.

The user must have signed in (or reauthenticated) within the last **5 minutes**,
or the API returns **401**. Web reauthenticates with the current password first,
then sends a **fresh** ID token (`getIdToken(true)`).

After Firebase applies the email-change action code, reload the Firebase user,
force-refresh its ID token, and send `{ "type": "sync" }`. The server derives the
new address from Firebase Auth and synchronizes the Firestore user record and any
linked Stripe customer. This request does not use Resend.

---

## Error responses

| Status | When |
|--------|------|
| 400 | Invalid `type`, or invalid `email` / `newEmail` |
| 401 | Missing/invalid Firebase token, or email-change session is older than 5 minutes |
| 409 | The requested new email is already attached to another Firebase account |
| 429 | More than 8 requests from the same IP in 15 minutes |
| 500 | Send failed (Resend or unexpected server error) |
| 503 | `RESEND_API_KEY` is not configured in that environment |

Error body is JSON, for example:

```json
{ "error": "Authentication required" }
```

```json
{ "error": "Unable to send email" }
```

---

## What iOS should implement

1. After a successful **new** Firebase signup, get an ID token from that user.
2. `POST /api/auth/email` with `{ "type": "welcome" }` and the Bearer token.
3. If the request fails, do not roll back account creation.
4. Do not send welcome on subsequent logins.
5. Stop using Firebase Auth’s built-in welcome / verification email templates
   for this flow. Firebase is only used here to create the user and generate
   action links on the server.

Optional, if those screens exist in the app:

- Password reset → `{ "type": "passwordReset", "email": "..." }` (no token)
- Resend verification → `{ "type": "verification" }` with token
- Change email → reauthenticate, then `{ "type": "emailChange", "newEmail": "..." }` with a fresh token

---

## How to confirm it matches web

Create a brand-new iOS test account and check:

1. The API returns `{ "success": true }`
2. Mail arrives from Resend (`HelixCard <hello@mail.helixcard.app>`, or the
   configured `RESEND_FROM_EMAIL`)
3. Subject is `Welcome to Helix!`
4. The header in the email is `Helix Digital Business Card`
5. **Download on the App Store** and **Get it on Google Play** open the store
   listings, and the "manage your cards on the web" link opens
   `https://www.helixcard.app/dashboard`
6. Email/password signups also include a verify-email section
7. Signing in again with the same account does **not** send another welcome email

---

## Example

```bash
# After Firebase signup, using that user's ID token:
curl -X POST https://www.helixcard.app/api/auth/email \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "type": "welcome" }'
```

Expected:

```json
{ "success": true }
```

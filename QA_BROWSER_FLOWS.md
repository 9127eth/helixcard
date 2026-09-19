# Helix Card — Browser QA Playbook

This document is written for an automated QA agent (e.g. Grok with computer use) that verifies Helix Card through a real browser. Follow the flows in order unless a run is scoped to smoke checks only.

---

## 1. Agent instructions

### Your job

Confirm that core user-facing flows load, render correctly, and behave as expected. Report **PASS**, **FAIL**, or **SKIP** for each check with a one-line reason and a screenshot when something fails.

### What you can test in a browser

- Page loads and navigation
- Auth UI (email/password login and register forms)
- Dashboard, card list, create/edit forms, live preview
- Public card pages (no login required)
- Contacts list and modals (create, view, edit, search)
- Settings and account UI
- Share modal, QR code display, copy-link feedback
- Static/marketing pages
- Dark mode toggle
- Basic responsiveness (desktop + one mobile viewport)

### What to SKIP (do not fail the run)

| Area | Why |
|------|-----|
| Google / Apple OAuth sign-in | Requires interactive OAuth popups and real accounts |
| Stripe checkout completion | Do not submit real payments; only verify the Get Helix Pro page loads and plan UI renders |
| Email delivery (welcome, verification, password reset) | Cannot verify inbox from browser alone |
| AI card scanning / camera OCR | Requires camera hardware and Pro account |
| NFC / Apple Wallet / Google Pay | Mobile-only or device-specific |
| Native iOS/Android apps | Out of web scope |
| Admin-only routes (`/admin/*`, `/cucop`) | Unless given admin credentials |

### Safety rules

- **Do not** create real Stripe charges.
- **Do not** delete production data unless using a dedicated QA account.
- **Do not** register throwaway accounts on production unless instructed — prefer provided QA credentials.
- Prefer **read-only** checks on production; use staging/local for create/update/delete tests when available.
- If a modal or cookie banner blocks interaction, dismiss it once and note it in the report.

---

## 2. Environment

Set these before running (replace placeholders):

| Variable | Example | Notes |
|----------|---------|-------|
| `BASE_URL` | `https://www.helixcard.app` | Production default |
| `BASE_URL` (local) | `http://localhost:3000` | Run `npm run dev` first |
| `QA_EMAIL` | `qa+helix@yourdomain.com` | Dedicated test account |
| `QA_PASSWORD` | *(from secrets store)* | Email/password auth only |
| `QA_PUBLIC_CARD_URL` | `https://www.helixcard.app/c/9odg5w/1ob` | Known live demo card |
| `QA_USERNAME` | `9odg5w` | Username segment of public URL |

### Smoke vs full run

- **Smoke (≈10 min):** Sections 3, 4.1, 5.1, 6.1, 12
- **Full (≈45 min):** All numbered sections

---

## 3. Global smoke check

**Goal:** App is up and baseline navigation works.

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Open `{BASE_URL}` while logged out | Landing page loads; Helix logo; headline mentions digital business cards |
| 3.2 | Scroll to `#pricing` (or click "View Pricing") | Three pricing columns: Traditional, Helix Basic ($0), Helix Pro |
| 3.3 | Scroll to `#auth` | Login/register panel visible on the right (desktop) or below hero (mobile) |
| 3.4 | Open `{BASE_URL}/presskit` | Press kit page loads |
| 3.5 | Open `{BASE_URL}/privacy-policy` and `{BASE_URL}/terms-of-service` | Both legal pages load without error |
| 3.6 | Open `{BASE_URL}/c/nonexistent-user-xyz` | Friendly "Card not found" or error message — not a blank page or 500 |

---

## 4. Authentication

**Goal:** Users can reach the authenticated app.

### 4.1 Login (required)

| Step | Action | Expected |
|------|--------|----------|
| 4.1.1 | Go to `{BASE_URL}` → auth section | Email and password fields visible |
| 4.1.2 | If "Register" is shown, switch to **Login** | Login form active |
| 4.1.3 | Enter `QA_EMAIL` / `QA_PASSWORD`, submit | Redirects to dashboard (home shows card list, not marketing page) |
| 4.1.4 | Confirm sidebar appears | Links: My Cards, Contacts, How It Works, Get Helix Pro, Shop, Support, Settings, Sign Out |

### 4.2 Register UI (optional, staging/local only)

| Step | Action | Expected |
|------|--------|----------|
| 4.2.1 | Log out → open auth section → switch to Register | First name, email, password fields appear |
| 4.2.2 | Submit with invalid email | Inline validation or error message |
| 4.2.3 | *(Skip on prod)* Complete registration | Lands on dashboard / welcome state |

### 4.3 Forgot password UI

| Step | Action | Expected |
|------|--------|----------|
| 4.3.1 | Logged out → Login → "Forgot password?" | Forgot-password form appears |
| 4.3.2 | Enter an email, submit | Success message or non-crashing response (do not verify email inbox) |

### 4.4 Sign out

| Step | Action | Expected |
|------|--------|----------|
| 4.4.1 | Sidebar → **Sign Out** | Returns to logged-out state; marketing home or login visible |

---

## 5. Dashboard — My Cards

**Goal:** Authenticated users manage business cards.

*Prerequisite: logged in as `QA_EMAIL`.*

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Navigate to `{BASE_URL}/dashboard` or sidebar **My Cards** | Page title area shows "Business Cards" |
| 5.1a | If user has no cards | Welcome banner with "Create Your First Card" CTA |
| 5.1b | If user has cards | At least one card tile with name, theme hint, Share / Edit / View buttons |
| 5.2 | Click **+** (create) or "Create Your First Card" | Navigates to `/create-card` |
| 5.3 | On a card tile, click **View** | Preview modal or full preview shows card content |
| 5.4 | On an **active** card, click **Share** | Share modal opens with URL and QR code |
| 5.5 | In share modal, click copy link | "Copied!" feedback appears |
| 5.6 | Card ⋮ menu → **Preview Card**, **Edit**, **Change Color** | Each opens without JS error |
| 5.7 | Inactive card (free second card) | "Inactive" badge; Share disabled or greyed out |

---

## 6. Create business card

**Goal:** New card form works and saves.

*Best on staging/local; on production only if QA account is disposable.*

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Open `/create-card` | "Create new card" heading; form + live preview side by side (wide screens) |
| 6.2 | Fill required fields: **First name**, **Description** (card label) | Live preview updates with entered name |
| 6.3 | Expand contact section; add phone and email | Preview shows contact section |
| 6.4 | Choose a **theme** (Classic / Dark / etc.) | Preview reflects theme change |
| 6.5 | Save / Create card | Redirect to dashboard or success toast; new card appears in list |
| 6.6 | First card on account | Marked **Main** (primary); public URL uses `/c/{username}` without slug |

---

## 7. Edit business card

**Goal:** Existing cards can be updated.

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | From dashboard, click **Edit** on a card | `/edit-card/{id}` loads with pre-filled data |
| 7.2 | Change job title or company, save | Dashboard and preview reflect change |
| 7.3 | Toggle collapsible sections (Social, Links, CV, etc.) | Sections expand/collapse without layout break |
| 7.4 | Click "My cards" back link | Returns to `/dashboard` |

---

## 8. Public card page (anonymous)

**Goal:** Shared links work for visitors without an account.

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | Open `{QA_PUBLIC_CARD_URL}` in a **new incognito/private** window | Card renders: name, role/company if present |
| 8.2 | Verify header actions | **Email This Card** and **Save Contact** buttons visible |
| 8.3 | Click **Email This Card** | Modal opens with email + optional note fields |
| 8.3a | Submit with invalid email | Validation error shown |
| 8.3b | *(Optional)* Submit valid test email | Success message (do not verify delivery) |
| 8.4 | Click **Save Contact** | `.vcf` download starts or browser prompts to save contact |
| 8.5 | If phone/email on card | `tel:`, `mailto:`, and "Send a text" links present |
| 8.6 | If social links configured | Icon buttons open external URLs in new tab |
| 8.7 | Open `{BASE_URL}/c/{QA_USERNAME}` (primary URL) | Resolves to user's primary card |
| 8.8 | Resize to mobile width (375px) | Card remains readable; no horizontal overflow |

---

## 9. Contacts

**Goal:** Contact management UI is functional.

*Prerequisite: logged in.*

| Step | Action | Expected |
|------|--------|----------|
| 9.1 | Sidebar → **Contacts** → `/contacts` | Contacts page loads; search bar and action buttons |
| 9.2 | Click **+** / Add contact | Create contact modal opens |
| 9.3 | Create contact with name only (e.g. "QA Test Contact") | Modal closes; contact appears in list |
| 9.4 | Search for the contact name | List filters correctly |
| 9.5 | Open contact → **View** | View modal shows saved fields |
| 9.6 | **Edit** contact → change company → save | List updates |
| 9.7 | **Manage Tags** | Tags modal opens |
| 9.8 | **Export** | Export modal opens (CSV option visible) |
| 9.9 | *(Optional)* Delete the QA test contact | Contact removed from list |

**Free account note:** Free tier allows up to **2 contacts**. Hitting the limit should show an upgrade prompt — verify messaging if testing limits.

---

## 10. Settings

**Goal:** Account settings page loads and key controls work.

| Step | Action | Expected |
|------|--------|----------|
| 10.1 | Sidebar → **Settings** → `/settings` | Settings page with account info |
| 10.2 | Subscription section | Shows Free or Pro status matching account |
| 10.3 | Email/password account: **Change password** | Form expands or modal opens |
| 10.4 | **Change email** (if available) | Form renders without error |
| 10.5 | Delete account control | Present but **do not confirm** on production |

---

## 11. Secondary pages (logged in)

**Goal:** Marketing and support surfaces stay healthy.

| Step | Action | Expected |
|------|--------|----------|
| 11.1 | **How It Works** `/how-it-works` | Feature sections render; CTAs to Dashboard and Contacts work |
| 11.2 | **Get Helix Pro** `/get-helix-pro` | Plan selector (monthly / yearly / lifetime); price displays; Stripe Elements area loads |
| 11.3 | **Shop** `/shop` | Shop page loads (external product links OK) |
| 11.4 | **Support** `/support` | FAQ accordions expand/collapse |
| 11.5 | **Dark mode** toggle in sidebar | UI switches light ↔ dark without broken contrast |

---

## 12. Error and edge cases

| Step | Action | Expected |
|------|--------|----------|
| 12.1 | `/edit-card/invalid-id-12345` while logged in | Graceful error or redirect — not infinite spinner |
| 12.2 | `/dashboard` while logged out | Redirect to home/login or spinner then home |
| 12.3 | `/create-card` while logged out | Redirect or auth prompt |
| 12.4 | Hard refresh on `/contacts` while logged in | Page recovers; contacts load (may brief spinner) |

---

## 13. Reporting template

Copy this for each run:

```markdown
# Helix Card QA Report

**Date:** YYYY-MM-DD HH:MM UTC  
**Environment:** production | staging | local  
**Base URL:** {BASE_URL}  
**Agent:** Grok / other  
**Run type:** smoke | full  

## Summary

| Status | Count |
|--------|-------|
| PASS   |       |
| FAIL   |       |
| SKIP   |       |

## Failures

| ID | Section | Step | Expected | Actual | Screenshot |
|----|---------|------|----------|--------|------------|
|    |         |      |          |        |            |

## Skipped

- (list items and reason)

## Notes

- Browser / viewport used
- Any flaky or intermittent behavior
- Recommended follow-up for humans
```

---

## 14. Quick reference — routes

| Route | Auth | Purpose |
|-------|------|---------|
| `/` | Optional | Marketing home; dashboard if logged in |
| `/dashboard` | Required | Business card list |
| `/create-card` | Required | New card form |
| `/edit-card/[id]` | Required | Edit existing card |
| `/c/[username]` | Public | Primary public card |
| `/c/[username]/[cardSlug]` | Public | Non-primary public card |
| `/contacts` | Required | Contact manager |
| `/settings` | Required | Account settings |
| `/how-it-works` | Required* | Product overview |
| `/get-helix-pro` | Required* | Subscription upgrade |
| `/shop` | Required* | NFC / merch shop |
| `/support` | Required* | FAQ and help |
| `/register` | Public | Standalone register (if linked) |
| `/reset-password` | Public | Password reset (needs email link) |
| `/verify-email` | Public | Email verification landing |

\*These routes use the app sidebar layout and expect a logged-in session in normal use.

---

## 15. Product rules (for interpreting results)

- **Free accounts:** 1 active card, up to 2 contacts. Additional cards may show as **Inactive**.
- **Pro accounts:** Up to 10 cards; all can be active; AI scanning, CV upload, custom colors unlocked.
- **Public URLs:** Primary card → `/c/{username}`. Other cards → `/c/{username}/{cardSlug}`.
- **Brand colors:** Primary accent `#7CCEDA`, lime CTA `#B8EB41`, coral `#FC9A99`.

---

## 16. Local dev (optional)

If testing against localhost:

```bash
cd /path/to/helixcard
npm install
npm run dev
```

Open `http://localhost:3000`. Firebase and Stripe must be configured in env for auth and payments to work locally; without them, skip auth-dependent flows and note **SKIP — env not configured**.

---

*Last updated: 2026-09-16. Update `QA_PUBLIC_CARD_URL` if the demo card is retired.*

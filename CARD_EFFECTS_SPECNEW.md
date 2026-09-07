# Card Effects — Developer Spec (New Effects & Visitor Tour)

> **Scope:** Supplement to [`CARD_THEMES_SPEC.md`](CARD_THEMES_SPEC.md). That doc covers designs (`theme`), custom colors, and the full settings contract for iOS. **This doc covers the effects added after the original themes spec**, the retired Holographic effect, and the **visitor effects tour** (“Try the other effects”).
>
> The web app renders effects; native clients only need to **persist the owner's choices** and expose the Pro-gated settings UI. Visitors browse effects on helixcard.io.

**Web source of truth** (update these first when shipping changes):

- `app/lib/cardEffects.ts` — effect ids, names, descriptions, interaction badges, free list, tour order, `showEffectTour`
- `app/components/effects/CardEffectLayer.tsx` — maps effect ids to renderers
- `firestore.rules` — `validEffect()` and `validEffectTour()` enforcement
- `app/lib/cardAppearance.ts` — client-side save validation (`prepareCardAppearance`)
- `app/lib/publicCard.ts` — resolves `effectTour` for the public card DTO

---

## What changed since the original `CARD_THEMES_SPEC.md`

The committed themes spec listed eight effects: `none`, `portal`, `portal-grid`, `holo`, `stardust`, `scramble`, `repel`, and `shatter`.

Since then we:

1. **Added seven new Pro effects** (see table below). `print` is implemented on web but **not in the picker** yet.
2. **Retired four effects** — `holo`, `current`, `develop`, `fold`. Existing saved values render as `none`; new writes cannot select them.
3. **Added the visitor effects tour** — a footer control that lets anyone preview every effect on a live card. Owners control visibility via a new Firestore field: **`effectTour`**.

Free effects are unchanged: **`none`**, **`portal-grid`**, and **`repel`**.

---

## Firestore fields

| Field | Type | Default | Who can write |
|---|---|---|---|
| `effect` | `string` | `"none"` | Any owner; Pro required for Pro effect ids (see below) |
| `effectTour` | `bool` | `true` (omit = on) | Any owner may write `true`. Only a **Pro owner** may write `false` |

**Document path:** `users/{uid}/businessCards/{cardSlug}`

**Entitlement:** Read `users/{uid}.isPro == true`. Never trust a card-level `isPro` field on the document.

### `effect` write rules

Store the lowercase **id** exactly as listed — no display names or aliases.

**Free** (any owner):

- `none`, `portal-grid`, `repel`

**Pro** (owner must have `isPro == true`):

- `portal`, `glitch`, `lantern-reveal`, `ripple`, `black-hole`, `take-one`, `overgrown`, `stardust`, `scramble`, `shatter`

**Not selectable** (rules reject new/changed writes):

- Retired: `holo`, `current`, `develop`, `fold`
- Disabled in picker: `print` (implementation exists; not exposed until re-enabled)

Unchanged legacy values on existing documents remain editable alongside contact fields, but cannot be *changed to* a retired id.

### `effectTour` write rules

| Stored value | Meaning |
|---|---|
| omitted or `true` | Visitors see **“Try the other effects”** on the public card |
| `false` | Tour hidden (**Pro owners only**) |

Rules:

1. Free owners **cannot** write `false` — Firestore rejects it.
2. Free owners **can** write `true` (including restoring the default after a downgrade).
3. Non-boolean values are rejected.
4. On **Pro downgrade**, a stored `effectTour: false` is **kept** in the document but **ignored at render time** (visitors see the tour again). Re-upgrading applies the saved `false`.

---

## Effect registry

Show **name**, **description**, and the **interaction** badge in the picker. List free effects first, then Pro effects in registry order. Mark Pro rows with a Pro badge; gray the badge for Pro accounts (no upsell).

### Free effects

| id | Name | Interaction | Description |
|---|---|---|---|
| `none` | None | — | Just the design, no motion. |
| `portal-grid` | Portal · The Grid | Press & hold, then drag | Press and hold to open a hole into a still neon wireframe dimension waiting behind the card. |
| `repel` | Repel | Drag near elements | Everything you drag near gets pushed out of the way like a magnet, then springs back into place. |

### Pro effects — previously documented

| id | Name | Interaction | Description |
|---|---|---|---|
| `portal` | Portal · Deep Space | Press & hold, then drag | Press and hold to open a hole in the card and look into deep space behind it, then drag the hole around. |
| `stardust` | Stardust | Drag or tap | Your finger leaves a glowing trail of sparks in the card's colors. Tap empty space for a burst. |
| `scramble` | Scramble | Drag over text | Drag across the card and the words you pass over dissolve into cipher characters, then decode themselves back. |
| `shatter` | Shatter | Drag over elements | Whatever you drag across crumbles into dust and re-forms a moment later. |

### Pro effects — **new since the original spec**

| id | Name | Interaction | Description | Notes |
|---|---|---|---|---|
| `glitch` | Glitch | Drag over content | Drag across the card and whatever you pass over breaks up like a bad signal: split color channels (cyan and magenta), torn slices, then it snaps back. | Disrupts text and icons under the pointer. |
| `lantern-reveal` | Lantern · First Light | Carry the lantern | Only a lantern is visible. Carry it across the card: wherever its light falls stays lit; once most of the card is lit, first light finishes the rest. | **Reveal effect** — content hidden until interaction. Keyboard-activatable gate. |
| `ripple` | Ripple | Tap or drag | Glass over water. A tap sends out a ring; dragging leaves a wake that gently bends the card. | Canvas distortion overlay. |
| `black-hole` | Black Hole | Press & hold | Hold to pull the card's contents backwards into a single point. Release and everything returns. | Content recedes toward center on hold. |
| `take-one` | Take One | Pull the card down | A wall-mounted holder shows a stack of cards behind glass. Pull the one in the slot down and out; it grows into the page. | **Reveal effect** — gate UI before content. Keyboard-activatable. |
| `overgrown` | Overgrown | Brush the leaves off | Fall-colored foliage hides the card. Brush it off the screen; it stays gone until refresh. | **Reveal effect** — canvas foliage overlay. |
| `print` | Print | Pull the press up | Pull a letterpress handle up; the arm arcs, the plate meets stock, and the card stamps into the paper. | **Not in picker.** Code kept in `PrintEffect.tsx` for a future release. |

### Retired effects

| id | Former name | Behavior |
|---|---|---|
| `holo` | Holographic | Renders as `none`. Cannot be newly selected. |
| `current` | Current | Same |
| `develop` | Develop | Same |
| `fold` | Fold | Same |

On the owner's next save, the web editor normalizes a retired stored value to `none`. iOS should show retired ids as locked/paused and not offer them in the picker.

---

## Reveal effects and accessibility

Three effects start with the real card **concealed** (`[data-fx-content]` hidden via CSS until revealed):

- `lantern-reveal`
- `take-one`
- `overgrown`

Behavior shared by all three:

- The public card sets `data-fx-revealed="true"` on the host once the visitor completes the reveal gesture (or activates the keyboard gate).
- Each reveal effect exposes a focusable control (`data-fx-control`) so keyboard and assistive-tech users can start without a pointer.
- **`prefers-reduced-motion: reduce`:** reveal gates and motion layers are skipped; content is shown immediately (`data-fx-revealed="true"`). The visitor effects tour is also hidden for reduced-motion users.

iOS does not need to replicate reveal logic — only persist the owner's `effect` choice.

---

## Visitor effects tour (`effectTour`)

### What it is

A **visitor-only preview** on the public card. It is **not** the owner's saved effect and is **never written** to Firestore by the tour itself.

- **Trigger label (visitor UI):** “Try the other effects”
- **Owner setting label (editor):** “Let visitors try every effect”
- **Firestore field:** `effectTour`

The tour sits in the card **footer**, directly above the **Get Your Card** button. While active, a compact floating copy of the controls stays pinned when the footer scrolls off-screen or when a reveal effect hides the main card content.

### How it works on web

1. Card opens on the owner's saved `effect` (respecting Pro entitlement via `getAvailableCardEffect`).
2. If the tour is enabled, the footer shows **“Try the other effects”**.
3. Tapping it starts browsing **every effect except `none`**, in registry order (`CARD_EFFECT_TOUR` in `cardEffects.ts`), beginning with the effect **after** the card's own.
4. Prev/next step through the list; **Done** (or “Back to this card's effect”) returns to the saved effect.
5. Refresh always restores the saved effect. The tour never changes what the owner saved.

The tour deliberately **does not mention Pro tiers** — upsell stays in the editor.

### Free vs Pro — who can turn it off

| Owner tier | Tour on public card | Can owner disable? | Editor UI |
|---|---|---|---|
| **Free** | Always on | **No** | Toggle shown **on** and **disabled**, with upgrade link |
| **Pro** | On by default | **Yes** — write `effectTour: false` | Toggle enabled; owner may turn off |

Additional downgrade behavior:

- A free owner with a stored `effectTour: false` (from a prior Pro period) keeps that value in Firestore but **visitors still see the tour**. Show the toggle as on with a “paused setting” note until they upgrade again.
- A free owner may always set `effectTour: true`.

### Reading the setting

**Raw Firestore** (owner settings screen):

```swift
// Pseudocode — read the stored value for the editor toggle
let storedTour = card.effectTour ?? true   // omit = on
let toggleOn = storedTour != false
let canDisable = owner.isPro
```

**Effective value for visitors** (what the public card actually shows):

```typescript
// app/lib/cardEffects.ts
function showEffectTour(effectTour: unknown, isPro: boolean): boolean {
  return !(isPro && effectTour === false);
}
```

The public API applies this in `toPublicCard()` so clients rendering from the DTO get the resolved boolean, not the raw stored value during a downgrade.

### iOS settings UI parity

Add a fourth appearance control (after Design, Custom colors, Effect):

1. **Label:** “Let visitors try every effect”
2. **Help text:** “Adds a ‘Try the other effects’ control above the Get Your Card button. Your card always opens with the effect you chose.”
3. **Default:** on (`true`, or omit field)
4. **Free:** toggle on, disabled, link to Pro upgrade; if stored `false`, show paused-state copy
5. **Pro:** toggle editable; off writes `effectTour: false`, on writes `true`

Validate saves with the same rules as `prepareCardAppearance()`:

- Reject `effectTour: false` from free accounts
- Reject non-boolean values
- Allow free users to write `true` even when a stored `false` exists

---

## Pro expiry / downgrade (effects + tour)

Same pattern as custom colors and Pro effects:

| Setting | Stored on downgrade | Rendered while `isPro == false` | Free owner may |
|---|---|---|---|
| Pro `effect` | Kept | `none` | Keep unchanged, or switch to a free effect |
| `effectTour: false` | Kept | Tour **shown** (ignored) | Set back to `true` |
| `customColors` | Kept | Ignored (preset design) | Clear to `null` |

Do not silently overwrite stored Pro settings when editing unrelated contact fields.

---

## Helper functions (mirror on native if useful)

From `app/lib/cardEffects.ts`:

| Function | Purpose |
|---|---|
| `FREE_CARD_EFFECTS` | `['none', 'portal-grid', 'repel']` |
| `isProCardEffect(id)` | `true` when id is not in the free list |
| `getAvailableCardEffect(effect, isPro)` | Resolves what the public card renders; unknown/retired/Pro-without-entitlement → `'none'` |
| `CARD_EFFECT_TOUR` | All effect ids except `'none'`, in picker order — tour sequence |
| `stepEffectTour(current, direction)` | Next/previous tour stop |
| `showEffectTour(effectTour, isPro)` | Whether visitors see the tour |

From `app/lib/cardAppearance.ts`:

| Function | Purpose |
|---|---|
| `prepareCardAppearance(data, isPro, existing?)` | Validates effect, custom colors, and `effectTour` before Firestore write |

---

## Rollout checklist for other platforms

1. Deploy updated **`firestore.rules`** together with web (rules must allow new effect ids and `effectTour`).
2. Add the seven new Pro effect ids to the native picker (exclude `print` until web enables it).
3. Remove **`holo`** from the picker; treat stored `holo` / `current` / `develop` / `fold` as paused → renders `none`.
4. Add the **`effectTour`** toggle using the labels and rules above.
5. Preserve unknown effect ids and `effectTour` on merge/update even if the native app is older than web.
6. No data migration required — missing fields use defaults (`effect: "none"`, tour on).

When web ships another effect, sync from `cardEffects.ts` and `CardEffectLayer.tsx` before enabling writes in rules.

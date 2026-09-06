# Card Appearance — iOS Settings Spec

> **Scope:** The iOS app lets users **choose** a card design, effect, and custom colors and **writes those settings to
> Firestore**. It does **not** render the public card — the web app at helixcard.io does that when
> someone opens the card URL. This doc is everything iOS needs for the settings UI and persistence.

**Web source of truth** (when we add new options, these files update first):

- `app/lib/cardThemes.ts` — design ids, names, descriptions, swatch gradients
- `app/lib/cardEffects.ts` — effect ids, names, descriptions, interaction badges, free effect list
- `app/lib/cardColors.ts` — the six color keys, solid starting palettes, normalization, and rendering map
- `firestore.rules` — enforced permissions and color validation

---

## The model

Each card has three independent settings:

| Firestore field | What it is | Example ids |
|---|---|---|
| `theme` | **Design** — colors, typography, surface | `classic`, `sunset`, `neon` |
| `effect` | **Effect** — motion when someone views the card on web | `none`, `portal`, `holo` |
| `customColors` | **Pro color overrides** — six opaque sRGB hex colors, or `null` for the preset | See schema below |

All preset designs are free. **None, Portal · The Grid, and Repel are free.**
Portal · Deep Space, Holographic, Stardust, Scramble, Shatter, and setting custom colors require **Helix Pro**.
Read `users/{uid}.isPro == true` for the current entitlement; never trust the card's `isPro` field.
Pro can pair any design, effect, and custom palette.

---

## Firestore

| | |
|---|---|
| **Document** | `users/{uid}/businessCards/{cardSlug}` |
| **`theme`** | `string`, optional — lowercase id from the design table below |
| **`effect`** | `string`, optional — lowercase id from the effect table below |
| **`customColors`** | map of exactly six hex strings, optional or `null` — see below |

### Write rules

1. Store **exactly** the `id` from the tables — lowercase, no aliases or display names.
2. **New card default:** `theme: "classic"`, `effect: "none"` (matches the web form).
3. Do not write `null` or `""` for `theme` / `effect` — omit the field or write a valid id.
4. `customColors: null` (or deleting the field) restores the preset palette. New cards use no overrides.
5. Firestore validates **new or changed** effects and custom colors. Free users cannot bypass the
   Pro restriction using the iOS SDK. Hex values must be uppercase `#RRGGBB` when written.
6. Use merge/update semantics when editing a card. Preserve fields the app does not understand.

### Pro expiry / downgrade

Keep existing Pro colors and effects in the document. The public card ignores custom colors and
renders `none` for a Pro effect while the owner's `isPro` is false. Re-upgrading restores them.
Free users may edit contact details while retaining unchanged Pro settings, clear custom colors,
or choose a free effect. They cannot create, change, or copy Pro settings onto another card.
Show stored Pro selections as locked/paused; do not silently replace them when editing other fields.

### Reading for the settings screen

When loading a card to populate the pickers:

- Use the stored `theme` / `effect` if present.
- If missing, show **Classic** and **None** as selected (same as web defaults).
- If the stored value is not in your local list (web shipped something new), still show it as
  selected if you can, or fall back to the defaults above until the app is updated.

---

## Design picker (`theme`)

Show name + description for each row. Optional: use the `preview` CSS gradient as a color swatch
(mobile can approximate with equivalent gradients).

| id | Name | Description | Preview (CSS gradient for swatch) |
|---|---|---|---|
| `classic` | Classic | Traditional black and white theme | `linear-gradient(135deg, #ffffff 50%, #111111 50%)` |
| `modern` | Modern | A modern look with blue-green accents | `linear-gradient(135deg, #F5FDFD, #7CCEDA)` |
| `dark` | Dark | Dark colors with shades of black and gray | `linear-gradient(135deg, #2c2d31, #4a5568)` |
| `sunset` | Sunset | Warm dusk gradient with terracotta accents | `linear-gradient(160deg, #FFF6EC, #F8A98F)` |
| `forest` | Forest | Deep evergreen tones with golden accents | `linear-gradient(160deg, #16281F 55%, #D9B45B)` |
| `editorial` | Editorial | Ivory paper and classic serif type, like a magazine | `linear-gradient(135deg, #F7F3EA 70%, #B3261E 70%)` |
| `aurora` | Aurora | Night sky washed with teal and violet northern lights | `linear-gradient(130deg, #0B1026, #0F4D3C, #3B1F5E)` |
| `neon` | Neon | Near-black with monospace type and a magenta-cyan glow | `linear-gradient(135deg, #0A0A12 40%, #F472B6 75%, #22D3EE)` |
| `ocean` | Ocean | Sunlit aqua with soft teal and blue currents | `linear-gradient(160deg, #E7F8FA, #2DD4BF)` |

---

## Effect picker (`effect`)

Show name + description. Optionally show the **interaction** string as a small badge (web does).

| id | Name | Interaction badge | Description |
|---|---|---|---|
| `none` | None | — | Just the design, no motion. |
| `portal` | Portal · Deep Space | Press & hold, then drag | Press and hold to open a hole in the card and look into deep space behind it, then drag the hole around. |
| `portal-grid` | Portal · The Grid | Press & hold, then drag | Press and hold to open a hole into a still neon wireframe dimension waiting behind the card. |
| `holo` | Holographic | Tilt your phone / move the mouse | A foil sheen and subtle 3D tilt that respond to how you hold your phone, or to the mouse on desktop. |
| `stardust` | Stardust | Drag or tap | Your finger leaves a glowing trail of sparks in the card's colors. Tap empty space for a burst. |
| `scramble` | Scramble | Drag over text | Drag across the card and the words you pass over dissolve into cipher characters, then decode themselves back. |
| `repel` | Repel | Drag near elements | Everything you drag near gets pushed out of the way like a magnet, then springs back into place. |
| `shatter` | Shatter | Drag over elements | Whatever you drag across crumbles into dust and re-forms a moment later. |

---

## Custom colors (`customColors`) — Pro only

Keep `theme` as the base design. Custom colors override its palette, retain its typography,
and replace gradients/glows with a **solid** background. The six colors remain the same in
light and dark mode; there is no second dark-mode palette and no alpha channel.

```json
{
  "theme": "classic",
  "effect": "repel",
  "customColors": {
    "background": "#FFFFFF",
    "button": "#000000",
    "buttonText": "#FFFFFF",
    "text": "#000000",
    "icon": "#000000",
    "position": "#666666"
  }
}
```

| Key | UI label | Applies to |
|---|---|---|
| `background` | Background | Card, header, footer, and social icon circle backgrounds |
| `button` | Buttons | All card action button backgrounds |
| `buttonText` | Button text | Text inside action buttons |
| `text` | Regular text | Name, credentials, pronouns, headings, body, links, social labels, footer |
| `icon` | Icons | Contact, social, link, document, and button icons; social circle borders |
| `position` | Position & company | Job title and company line |

All six keys are required whenever the map is present. Do not send extra keys, partial maps,
RGB objects, CSS colors, three-digit hex, or eight-digit hex. The write pattern is
`^#[0-9A-F]{6}$`. Normalize input by trimming whitespace, adding `#` if omitted, and uppercasing;
reject anything other than six hex digits. Example: `7cceda` becomes `#7CCEDA`.
For native iOS controls, convert to **sRGB** before rounding each component to `0...255` and
formatting with two hex digits. Alpha is always `1.0`. Do not serialize Display P3 components
as if they were sRGB. Web ignores an invalid stored palette as a whole and renders the preset.

### Starting palettes

When the user enables custom colors, initialize all six values from the selected design below.
These are solid starting colors, not reproductions of preset gradients. Selecting another design
while custom colors are enabled keeps the user's six colors; restoring design colors sets the
map to `null`. Re-enabling custom colors starts from the currently selected design.

| Design | Background | Button | Button text | Text | Icon | Position |
|---|---|---|---|---|---|---|
| `classic` | `#FFFFFF` | `#000000` | `#FFFFFF` | `#000000` | `#000000` | `#666666` |
| `modern` | `#F5FDFD` | `#7CCEDA` | `#000000` | `#333333` | `#FC9A99` | `#666666` |
| `dark` | `#323338` | `#40444B` | `#FFFFFF` | `#DCDDDE` | `#FFFFFF` | `#B9BBBE` |
| `sunset` | `#FFF6EC` | `#C2410C` | `#FFF7ED` | `#43302B` | `#C2410C` | `#8A6355` |
| `forest` | `#16281F` | `#D9B45B` | `#1A2B21` | `#E4EDE2` | `#D9B45B` | `#9FB49D` |
| `editorial` | `#F7F3EA` | `#14110C` | `#F7F3EA` | `#1A1712` | `#B3261E` | `#8A7F6A` |
| `aurora` | `#0B1026` | `#7FF0C3` | `#0B1026` | `#E6EEFB` | `#7FF0C3` | `#9FB3D1` |
| `neon` | `#0A0A12` | `#22D3EE` | `#0A0A12` | `#E8E8F0` | `#F472B6` | `#9BA0B8` |
| `ocean` | `#E7F8FA` | `#0E7490` | `#F0FBFF` | `#10394A` | `#0E7490` | `#4E7A8A` |

---

## Picker layout and unsaved preview

1. **Design** — preset swatches, available to everyone.
2. **Custom colors** — a Pro toggle and only the six controls above. Offer a color picker and
   hex entry per control, plus “Restore design colors”. Free users see an upgrade link.
3. **Effect** — mark Portal · Deep Space, Holographic, Stardust, Scramble, and Shatter as Pro and disable them for free users.
4. **Live preview** — updates immediately from the local form draft, before Save. It shows the
   actual public card renderer, including effects. Users can scroll the preview and try effects;
   contact, email, download, and navigation actions are disabled inside the preview.

The web form uses a same-origin `/card-preview` iframe. It sends the current draft in memory via
`postMessage`; it does not write Firestore or put draft content in a URL. The route accepts only
messages from its same-origin parent, and is not a public API for native clients. The existing
“View Saved Card” flow is separate and opens the persisted card.

For iOS parity, maintain a local draft and show its six colors in a native preview before Save.
If exact web/effect preview is needed in a WKWebView, implement a dedicated native bridge in a
follow-up; do not save temporary settings to the real card just to preview them. Opening the
public card URL shows saved settings only. Native rendering of the full web effects remains
outside this settings contract.

`cardDepthColor` remains a legacy field for the dashboard card grid and is unrelated to these colors.

## Rollout and compatibility

Deploy the updated `firestore.rules` together with the web changes, before shipping iOS controls.
No data migration is needed. Missing `customColors` uses the preset. Existing Pro-only effects
are retained but paused on free accounts. Rules reject new or changed invalid effects/colors;
unchanged legacy values remain editable alongside contact details. Unknown theme/effect ids
still render with the existing modern/none fallbacks on web.

When web adds an option, update the iOS picker from `cardThemes.ts` / `cardEffects.ts`. Older iOS
versions must preserve unknown ids and `customColors` during unrelated edits. Do not rebuild
and overwrite the entire document using only fields known to the old app.

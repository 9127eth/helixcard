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

Each card has four independent settings:

| Firestore field | What it is | Example ids |
|---|---|---|
| `theme` | **Design** — colors, typography, surface | `classic`, `sunset`, `neon` |
| `effect` | **Effect** — motion when someone views the card on web | `none`, `portal`, `glitch` |
| `customColors` | **Pro color overrides** — six opaque sRGB hex colors, or `null` for the preset | See schema below |
| `effectTour` | **Effects tour** — whether visitors can browse every effect from the card footer | `true` (default), `false` (Pro only) |

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
| **`effectTour`** | `bool`, optional — omit or `true` shows the visitor effects tour; `false` hides it and is accepted only from a Pro owner |

### Write rules

1. Store **exactly** the `id` from the tables — lowercase, no aliases or display names.
2. **New card default:** `theme: "classic"`, `effect: "none"` (matches the web form).
3. Do not write `null` or `""` for `theme` / `effect` — omit the field or write a valid id.
4. `customColors: null` (or deleting the field) restores the preset palette. New cards use no overrides.
5. Firestore validates **new or changed** effects and custom colors. Free users cannot bypass the
   Pro restriction using the iOS SDK. Hex values must be uppercase `#RRGGBB` when written.
6. Use merge/update semantics when editing a card. Preserve fields the app does not understand.
7. `effectTour`: omit it or write `true` for free accounts. Only a Pro owner may write `false`; rules reject
   `false` from a free account and any non-boolean value.

### Pro expiry / downgrade

Keep existing Pro colors and effects in the document. The public card ignores custom colors and
renders `none` for a Pro effect while the owner's `isPro` is false. Re-upgrading restores them.
Free users may edit contact details while retaining unchanged Pro settings, clear custom colors,
or choose a free effect. They cannot create, change, or copy Pro settings onto another card.
Show stored Pro selections as locked/paused; do not silently replace them when editing other fields.
A stored `effectTour: false` is likewise kept but ignored while `isPro` is false (visitors see the tour),
and applies again after re-upgrading. A free account may set it back to `true` at any time.

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
| `glitch` | Glitch | Drag over content | Drag across the card and whatever you pass over breaks up like a bad signal: copies in split color channels (cyan and magenta) slide apart and tear into shifted slices, icons and the photo flash the wrong colors, then everything snaps back. |
| `lantern-reveal` | Lantern · First Light | Carry the lantern | Only a lantern is visible. Carrying it (or scrolling the card beneath it) lights everything its flame passes over, permanently; once most of the card is lit, the last of the dark lifts. The lantern stays on screen and can be carried again. |
| `ripple` | Ripple | Tap or drag | Rings and a wake gently distort the real content, then settle. |
| `black-hole` | Black Hole | Press & hold | The original content recedes into a central point, preserving its colors; release restores it. |
<!-- Temporarily disabled; restore with PrintEffect when ready.
| `print` | Print | Pull the press up | Pull a letterpress bar upward: the arms arc, the platen meets blank stock, and the card stamps into the paper from the contact line. An incomplete stroke returns the handle. |
-->
| `take-one` | Take One | Pull the card down | A wall-mounted holder shows a stack of the card behind glass. The card in its slot follows the finger down; once its top clears the slot it grows into the page and the holder lifts away. A short pull slides it back. |
| `overgrown` | Overgrown | Brush the leaves off | Fall-colored foliage brushes off the screen and stays gone until refresh. |
| `stardust` | Stardust | Drag or tap | Your finger leaves a glowing trail of sparks in the card's colors. Tap empty space for a burst. |
| `scramble` | Scramble | Drag over text | Drag across the card and the words you pass over dissolve into cipher characters, then decode themselves back. |
| `repel` | Repel | Drag near elements | Everything you drag near gets pushed out of the way like a magnet, then springs back into place. |
| `shatter` | Shatter | Drag over elements | Whatever you drag across crumbles into dust and re-forms a moment later. |

---

Holographic (`holo`), Current (`current`), Develop (`develop`), and Fold (`fold`) are retired. Existing saved values render as `none`; the editor normalizes them to `none` on its next save. New writes cannot select them.

The remaining new effects are Pro-only, using the same entitlement checks as the other Pro effects. First Light, Take One, and Overgrown start concealed and offer keyboard activation. Reduced-motion viewers see readable content without gesture gates. These interactions are decorative, not authentication.

## Effects tour (`effectTour`)

The public card footer carries a “Try the other effects” control directly above the **Get Your Card**
button (the “create a card like this one for free” line sits below the button). It lets a visitor step
through every effect except `none`, in registry order, starting with the one after the card's own
effect. Each stop names the effect and shows its interaction cue; it never labels tiers, since the
upsell belongs in the editor. The tour is a visitor-side preview only: it is never written anywhere, the
card always opens on its saved effect, and a refresh returns to it. While touring, a compact floating
copy of the controls stays on screen when the footer is scrolled away or a reveal effect (First Light,
Take One, Overgrown) conceals the card. Reduced-motion visitors never see the tour.

Free cards always show it — like the footer link, it is how Helix spreads. A Pro owner may hide it by
writing `effectTour: false`. Web renders from `showEffectTour(card.effectTour, ownerIsPro)` in
`app/lib/cardEffects.ts`; the public API resolves the same value into the card DTO.

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
3. **Effect** — list the free effects first, then the Pro ones in registry order. Mark Pro effects with a Pro
   badge and disable them for free users; show the badge in gray for Pro accounts, where it no longer upsells.
4. **Effects tour** — a toggle “Let visitors try every effect”, on by default. Free accounts see it on and
   disabled with an upgrade link; Pro may turn it off. Show a stored `false` as paused on a free account.
5. **Live preview** — updates immediately from the local form draft, before Save. It shows the
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

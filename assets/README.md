# buky — brand assets

Vector wordmark and lockup assets for **buky**, the app family by **Butake**.

All text in these files is **outlined** (converted to vector paths), so they render
identically on every platform with no font installed. No `<text>` elements, no font
dependency at runtime.

## Files

### Wordmark
| File | Use | Fill |
| --- | --- | --- |
| `wordmark/buky-wordmark.svg` | Wordmark on light backgrounds | Forest Ink `#0F2922` |
| `wordmark/buky-wordmark-light.svg` | Wordmark on dark backgrounds | Mist `#F2FBF7` |

### Lockup (symbol + wordmark)
| File | Use | Symbol | Wordmark |
| --- | --- | --- | --- |
| `lockup/buky-lockup-horizontal.svg` | Primary lockup, light backgrounds | Forest Ink `#0F2922` | Forest Ink `#0F2922` |
| `lockup/buky-lockup-horizontal-dark.svg` | Primary lockup, dark backgrounds | Vital Green `#00E091` | Mist `#F2FBF7` |
| `lockup/buky-lockup-stacked.svg` | Vertical / square contexts | Vital Green `#00E091` | Forest Ink `#0F2922` |

All SVGs use a tight `viewBox`, `role="img"`, and a `<title>` for accessibility.
Backgrounds are transparent.

## Typography

- **Typeface:** Plus Jakarta Sans, **Bold (700)**.
- **Source:** `latin-700-normal.ttf` (Fontsource / jsDelivr mirror), stored for reference at
  `references/fonts/pjs-700.ttf`.
- The wordmark is lowercase `buky`, outlined from the Bold weight at its native advance
  widths and kerning. Cap height of the source is 745/1000 em.

To regenerate from the font, outline the string `buky` (lowercase, weight 700) with
`opentype.js` glyph-by-glyph and fit the `viewBox` to the path bounding box.

## Brand colors

| Name | Hex |
| --- | --- |
| Forest Ink | `#0F2922` |
| Vital Green | `#00E091` |
| Mist | `#F2FBF7` |

## Layout & proportions

- Symbol height ≈ **1.4 ×** the wordmark cap height.
- Gap between symbol and wordmark (horizontal lockup) ≈ **0.4 ×** symbol width.
- Stacked lockup: symbol centered above, wordmark centered below, gap ≈ 0.32 × symbol height.

## Clear space

Keep clear space around the lockup equal to **the width of the "B" symbol's vertical bar**
(roughly the stroke thickness of the mark) on all sides. When in doubt, use the symbol's
bar width as the minimum padding between the lockup and any other element or edge.

## Minimum size

- **Lockups:** do not render below **24 px** tall (symbol height) / **120 px** wide
  (horizontal). Below this the symbol's interior detail starts to fill in.
- **Wordmark alone:** do not render below **16 px** cap height.
- For print, keep the lockup at **≥ 10 mm** tall.

As vectors these files scale infinitely upward with no loss.

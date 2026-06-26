# Color tokens

`scripts/generate-tokens.mjs` reads `brand.config.json` and emits one source of truth for
brand colors that the app icon, wordmark, and UI all consume.

```bash
node scripts/generate-tokens.mjs --config brand.config.json --out out/tokens
# or
npm run tokens
```

## What's generated (in `out/tokens/`)

- **`tokens.json`** — machine-readable model:
  ```json
  {
    "brand":    { "vitalGreen": "#00E091", "leaf": "#22C55E", "emerald": "#059669", "forestInk": "#0F2922", "mist": "#F2FBF7" },
    "products": { "<key>": { "name": "...", "accent": "<bg>", "accentDark": "<bgDark>", "symbol": "<fg>" } },
    "themes":   { "<key>": { "label": "...", "bg?": "...", "fg?": "...", "accent?": "..." } }
  }
  ```
  The brand palette is a fixed set of identity colors. Each product's `accent` is its
  distinctive background color (`bg` in the config) and `symbol` is its foreground glyph color (`fg`).

- **`Color.kt`** — Kotlin Compose tokens (`package cl.butake.buky.theme`). `#RRGGBB` is
  converted to a `0xFFRRGGBB` ARGB literal (opaque). Provides `object BukyColors` with the
  brand palette and a `products: Map<String, ProductColors>` lookup.

- **`tokens.css`** — CSS custom properties under `:root`
  (`--buky-vital-green`, `--buky-<key>-accent`, `--buky-<key>-symbol`, …).

## Wire `Color.kt` into a Compose theme

Copy `Color.kt` into your shared `commonMain` theme package (adjust the package name to match
your project), then feed the tokens into a `MaterialTheme` `ColorScheme`:

```kotlin
import cl.butake.buky.theme.BukyColors

@Composable
fun BukyTheme(productKey: String = "buky", content: @Composable () -> Unit) {
    val product = BukyColors.product(productKey)
    val scheme = lightColorScheme(
        primary = product.accent,
        onPrimary = product.symbol,
        background = BukyColors.Mist,
        onBackground = BukyColors.ForestInk,
    )
    MaterialTheme(colorScheme = scheme, content = content)
}
```

Regenerate (`npm run tokens`) after editing `brand.config.json` rather than hand-editing `Color.kt`.

## Wire `tokens.css` into web

Import it once at the app root so the variables are globally available:

```css
@import "tokens.css";

.btn-primary { background: var(--buky-salud-accent); color: var(--buky-salud-symbol); }
.app-shell   { background: var(--buky-mist); color: var(--buky-forest-ink); }
```

Adding a product or theme is a one-line edit in `brand.config.json` followed by a regenerate —
all three outputs stay in sync.

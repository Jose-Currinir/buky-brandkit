# AGENTS.md — guide for AI coding agents

Canonical instructions for any AI agent (Codex, Claude, Cursor, Copilot, Jules, Zed, etc.)
working in this repo. Read this fully before editing. Human contributors: see `README.md`.

`brandkit` applies the **Buky / Butake** brand identity to app projects: it detects the
stack, generates a layered app-icon system per product + seasonal themes, installs the
assets, and scaffolds **remote icon switching**. It works both as a Claude Code skill
(`SKILL.md`) and as plain Node scripts.

---

## 0. The one rule you must not get wrong

You **cannot** push a brand-new icon image to an already-installed app over the air. iOS and
the Play Store forbid it and the APIs do not exist. What this project does is **bundle a set
of alternate icons at build time** and let a **remote config (Firebase Remote Config) choose
which bundled one is active**. So:

- ✅ Switching among **already-shipped** themes is remote and instant.
- ❌ Delivering a **new** image OTA is impossible — a new theme needs an app update.

Never write code, docs, or a reply that implies arbitrary OTA icon delivery is possible.

---

## 1. Brand invariants (do not "improve" these without being asked)

These were decided deliberately. Don't reopen them:

- **Naming**: company = **Butake**; app family = **Buky** (wordmark always lowercase);
  products are `Buky <X>` (e.g. `Buky Salud`, `Buky GPS`).
- **Icon model** = solid **per-product background color + white symbol**; the flagship app
  `buky` is the exception: **forest background + mint symbol**. The per-product
  *distinctive is the background color* — **one color token per product**, nothing else.
- **Rejected approaches** (don't propose them again): corner badges, ribbons, strips, or
  any decoration bolted onto the logo; per-product recoloring of the symbol layered as a
  corner element. They look amateur and break OS masks. Keep it to the layered model below.
- **Colors**: Vital Green `#00E091`, Leaf `#22C55E`, Emerald `#059669`, Forest Ink
  `#0F2922` (text + dark bg), Mist `#F2FBF7`. Product accents live in `brand.config.json`.
- **Font**: Plus Jakarta Sans (wordmark outlined in `assets/`). **UI icon set**: Phosphor —
  cross-platform SVG. Do **not** standardize on SF Symbols (license forbids non-Apple use).

## 2. The 3-layer icon system (why it survives every OS)

Every icon derives from three reusable layers:

| Layer | Transparent? | Used by |
|-------|--------------|---------|
| `bg` (+ `bg-dark`) | no — **full-bleed**, no baked corners | iOS bg, Android `<background>`, web, store icons |
| `fg` (symbol) | yes | iOS fg, Android `<foreground>`, every mask |
| `mono` (silhouette) | yes | Android 13+ themed, iOS tinted, Safari pinned tab, notifications |

Hard rules (see `references/icon-system.md`):
- Background is **full-bleed with no rounded corners baked in** — the OS rounds/masks. Adding
  your own rounded rect double-rounds.
- **No baked effects** (shadows, gradients, glass). The OS adds Liquid Glass etc.
- The symbol is framed at **`safeZone` = 0.56** of the canvas longest side, centered on the
  symbol's **real ink bbox** center `(401.13, 404.22)` — NOT the 810×810 viewBox (it's
  off-center). 0.56 fits inside both the Android adaptive safe circle and the iOS squircle, so
  the "B" is never clipped. Don't change 0.56 without re-validating both masks.

## 3. Repo map

```
SKILL.md              Claude Code skill (workflow + when to trigger)
brand.config.json     SINGLE SOURCE OF TRUTH — products, themes, framing
scripts/
  detect-stack.mjs    KMP / native-ios / native-android / web detection
  generate-icons.mjs  layers + platform assets + theme alternates + WCAG contrast check
  generate-tokens.mjs Color.kt / tokens.css / tokens.json
  install/*.mjs        kmp, native-ios, native-android, web installers
  lib/symbol.mjs       "B" path data + bbox + placed()/svg()/symbol() helpers
integration/
  kmp/                 IconManager (expect + .android/.ios actuals) + RemoteThemeClient (Firebase)
  ios/                 AlternateIcons.swift + Info-AlternateIcons.plist
  android/             activity_aliases.xml + IconAliasHelper.kt
references/            icon-system, tokens, remote-switching, per-stack install guides
assets/                outlined buky wordmark + lockups
test/                  node --test detection tests
```

## 4. Commands

```bash
npm install                                  # deps: sharp (icons), opentype.js (wordmark, dev)
npm run detect -- /path/to/app               # print {stack, supported, targets}
npm run generate                             # icons + theme alternates -> out/icons
npm run tokens                               # Color.kt / tokens.css / tokens.json -> out/tokens
node --test                                  # run tests
node scripts/install/<stack>.mjs <target> out/icons [product]
```
Generated output goes to `out/` (git-ignored). Node 18+. ESM only (`.mjs`, `import`).

## 5. How to extend

- **Add a product**: add one entry to `products` in `brand.config.json`
  (`{key, name, bg, bgDark, fg, glyph?}`). Its `bg` color is the entire distinctive. Re-run
  `generate`. Nothing else to touch.
- **Add a theme** (seasonal): add to `themes` (`{key, label, bg?, fg?, rainbow?, accent?}`).
  `generate` emits its alternates; then register it: iOS `CFBundleAlternateIcons`, an Android
  `<activity-alias>` (see `integration/`), and the `BUNDLED_THEMES`/alias maps in
  `IconManager`. Remember: a new theme requires shipping an app update.

## 6. Conventions

- Keep scripts dependency-light (only `sharp`, dev-only `opentype.js`). Match the existing
  terse ESM style: push async work to a `tasks` array, `await Promise.all(tasks)`.
- Don't hardcode product colors in scripts — read `brand.config.json`.
- Anything needing a paid Apple Developer account, Firebase project, or Xcode `.pbxproj`
  mutation is a **STUB**: leave it marked `// STUB:` and tell the user what to provision. Do
  not fake it.
- When you touch the icon math, re-run `npm run generate` and eyeball a circle-masked and a
  squircle render to confirm nothing clips.

## 7. Tool-specific notes

- **Claude Code**: this repo is also a skill — `SKILL.md` is the entry point; it triggers on
  app-icon / launcher-icon / branding tasks even without the word "brandkit".
- **Codex / Cursor / others**: there is no build step; run the Node scripts directly. CI
  (`.github/workflows/ci.yml`) runs `node --test` + a generate smoke run on every push — keep
  it green.

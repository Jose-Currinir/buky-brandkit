# GitHub Copilot instructions

Read **[../AGENTS.md](../AGENTS.md)** — it is the canonical guide for this repo (brand
invariants, the 3-layer icon system, commands, conventions, and the critical
remote-switching constraint: you can only switch among build-time-bundled icons, never push
a new image over the air).

Quick reminders:
- ESM Node scripts (`.mjs`), deps kept light (`sharp`, dev-only `opentype.js`). No build step.
- `brand.config.json` is the single source of truth for products/themes — don't hardcode colors.
- Icon symbol is framed at safeZone 0.56, centered on its real ink bbox; backgrounds are
  full-bleed with no baked corners or effects (the OS rounds and adds glass).
- Mark anything needing a paid Apple account / Firebase / Xcode pbxproj edits as `// STUB:`.

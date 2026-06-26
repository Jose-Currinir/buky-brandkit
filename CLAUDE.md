# CLAUDE.md

The canonical agent guide for this repo is **[AGENTS.md](AGENTS.md)** — read it first; it
covers the brand invariants, the 3-layer icon system, commands, and the critical
remote-switching constraint (no OTA image push).

Claude Code specifics:
- This repo is also a **skill**. `SKILL.md` is the entry point and triggers on app-icon /
  launcher-icon / favicon / branding tasks for Buky apps — even when the user doesn't say
  "brandkit". Follow its workflow (detect → generate → install → scaffold remote switching).
- To install the skill locally: symlink or copy this repo into `~/.claude/skills/brandkit/`.
- Don't duplicate guidance here; if a rule changes, edit `AGENTS.md` and keep this a pointer.

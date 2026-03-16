# GovEyewear Theme Agent Rules

## Canonical Workspace (Mandatory)
- Canonical working repo path: `/Users/p/Code/GovEyewear/Site`
- Do not use `/Users/p/Documents/_Arocep/__ theme/goveyewear` for edits, pulls, pushes, or commits.
- If a session starts in the old `Documents` copy, switch immediately to the canonical `Code` repo before doing any work.

## Branch & Release Model (Mandatory)
- Source of truth is this local Git repo linked to Shopify GitHub integration.
- Never work directly on `main`.
- Use a dedicated working branch (prefix `codex/`).
- Validate all changes on staging theme preview before any live deployment.
- Treat live deployment as a post-approval release step only.

## Deploy Protocol (Mandatory)
- Always deploy to staging first: `160581189882`.
- Only deploy to live after explicit approval from user in current thread.
- Live theme ID: `160510771450`.
- Commit before each push.
- Announce target theme ID before running any push command.

## Settings Sync Protocol
- Pull from **live first** before making any code edits or pushes.
- When pulling from live, **only sync user settings diffs** (do not pull development files/code).
- If staging settings need to be synced, **only sync user settings diffs** (do not pull development files/code).
- If user says they changed admin/theme settings, pull live settings first before making code edits.
- `config/settings_data.json` and `config/settings_schema.json` can carry merchant config; do not overwrite blindly.
- Sync settings first, then edit.
- Commit the settings sync before making additional changes.

## Scope Rules
- Prefer small, localized, component-level edits.
- Avoid sweeping theme-wide changes unless user explicitly asks.
- Prefer file-scoped pushes (`--only`) when practical.

## Implementation Standard
- No shortcuts.
- No hacks.
- No inline styles.
- No stacking partial fixes.
- If something is wrong, trace the actual failure point.
- Clean up prior bad code as part of the fix.
- Prefer durable, scoped, maintainable implementations over fast patches.

## Documentation Rule
- Document shipped changes in `CHANGELOG.md` when present, otherwise provide a concise PR-style change summary in final handoff.

## Section Architecture Rule
- Don’t solve the symptom first.
- First inspect whether the section model is wrong.
- Separate content controls from presentation controls before adding more settings.

## Skill Usage
- Use `shopify-staging-release` skill from:
  - `.codex/skills/shopify-staging-release/SKILL.md`
- Trigger this skill for any Shopify pull/push/deploy request in this repo.

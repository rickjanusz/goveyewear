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
- Default to file-scoped pushes (`--only`) unless the user explicitly requests a full push.
- If more than 3 files would be pushed, stop and ask for approval.
- Never push `config/settings_data.json` or `config/settings_schema.json` unless the task explicitly requires settings changes.

## Settings Sync Protocol
- Pull from **live first** before making any code edits or pushes.
- When pulling from live, **only sync user settings diffs** (do not pull development files/code).
- If staging settings need to be synced, **only sync user settings diffs** (do not pull development files/code).
- If user says they changed admin/theme settings, pull live settings first before making code edits.
- `config/settings_data.json` and `config/settings_schema.json` can carry merchant config; do not overwrite blindly.
- Sync settings first, then edit.
- Commit the settings sync before making additional changes.
- Use the settings-only pull commands:
  - Live: `./scripts/shopify theme pull --store=goveyewear.myshopify.com --theme=160510771450 --nodelete --only config/settings_data.json --only config/settings_schema.json`
  - Staging: `./scripts/shopify theme pull --store=goveyewear.myshopify.com --theme=160581189882 --nodelete --only config/settings_data.json --only config/settings_schema.json`

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

## Local Dev Defaults
- Default dev port: `9292`. If busy, try `9293`, then `9294`, then `9295`.

## Permissions Note
- Committing and Shopify CLI operations (including launching local dev) may require elevated permissions and can reset Shopify CLI preferences.
- If Shopify CLI preferences are corrupted or blocking progress, remove them automatically.
- The user has granted permission to proceed with these automatically when needed.

## PR Policy
- After pushing to GitHub, auto-open a PR unless the user explicitly says not to.

## Handoff Protocol (Required)
- Before any pull/push, read `AGENTS.md` and `/Users/p/Code/GovEyewear/Site/WORKLOG.md`.
- Before any push, state:
  - Current branch + HEAD commit hash
  - Last pushed commit hash (GitHub)
  - Target theme ID (staging/live)
  - Exact file list to be pushed
  - Whether local dev server is running (port)
- After completing work, update `/Users/p/Code/GovEyewear/Site/WORKLOG.md` with:
  - Branch + commit hash
  - Pull/push commands run (with theme IDs)
  - Exact files pushed
  - Staging/live preview links
  - Open TODOs/approvals needed

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

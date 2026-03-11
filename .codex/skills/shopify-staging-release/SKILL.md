---
name: shopify-staging-release
description: Use this when making Shopify theme changes in this repo. Enforces branch-based staged workflow, settings-safe edits, explicit live approval, and commit-per-push workflow.
---

# Shopify Staging Release

## Use This Skill When
- The user asks to edit/push/pull/deploy Shopify theme code.
- The user asks to push to live.
- The user asks to sync admin/theme settings.

## Git Branch Rules
- Never make direct edits on `main`.
- Work on a dedicated branch (`codex/<task-name>`).
- Stage validation is required before release.

## Required Workflow
1. Pull the target theme first before making any code edits or pushes.
2. If admin changes are expected, treat the pull as mandatory settings sync.
3. Commit the settings sync before additional edits.
4. Make scoped edits only (prefer file-level pushes when possible).
5. Commit before every push.
6. Push to staging theme first.
7. Validate the staging preview URL behavior against the requested change.
8. Ask for explicit approval.
9. Push the same commit to live only after approval.

## Theme Targets
- Live theme: `160510771450` (`GovEyewear (Dawn)`)
- Staging theme: `160581189882` (`GovEyewear Dev (Staging)`)

## Commands
- Pull staging:
  - `./scripts/shopify theme pull --store=goveyewear.myshopify.com --theme=160581189882 --nodelete`
- Push staging (full):
  - `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160581189882 --path . --nodelete`
- Push staging (single file):
  - `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160581189882 --path . --nodelete --only <path>`
- Push live (single file, only after approval):
  - `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160510771450 --path . --nodelete --only <path> --allow-live`

## Settings Safety
- `config/settings_data.json` and `config/settings_schema.json` may include merchant-managed configuration.
- Pull/sync first for every Shopify code task, not only when admin changes are expected.
- Avoid accidental overwrite of merchant settings with stale local files.

## Documentation
- Add concise release notes to `CHANGELOG.md` when present.
- If no changelog file exists, provide PR-style change notes in final handoff.

## Non-Negotiables
- Never push to live first.
- Never push to live without explicit user approval in the current thread.
- Always state which theme ID (live or staging) is being targeted before a push.
- If CLI errors, stop and fix tooling before retrying deploys.

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
1. Pull from **live first** before making any code edits or pushes.
2. When pulling from live, sync only merchant-managed theme editor files and avoid general code pulls.
3. If staging settings need to be synced, sync only merchant-managed theme editor files and avoid general code pulls.
4. Merchant-managed theme editor files include `config/settings_data.json`, `config/settings_schema.json`, and theme-editor-managed product templates such as `templates/product*.json`.
5. If admin changes are expected, treat the live pull as mandatory merchant-config sync.
6. Commit the settings/template sync before additional edits.
7. Make scoped edits only (prefer file-level pushes when possible).
8. Commit before every push.
9. Push to staging theme first.
10. Validate the staging preview URL behavior against the requested change.
11. Ask for explicit approval.
12. Push the same commit to live only after approval.
13. Default to file-scoped pushes (`--only`) unless the user explicitly requests a full push.
14. If more than 3 files would be pushed, stop and ask for approval.
15. Never push `config/settings_data.json`, `config/settings_schema.json`, or `templates/product*.json` unless the task explicitly requires merchant-config changes.

## Theme Targets
- Live theme: `160510771450` (`GovEyewear (Dawn)`)
- Staging theme: `160581189882` (`GovEyewear Dev (Staging)`)

## Commands
- Pull live merchant config (settings + product templates only):
  - `./scripts/shopify theme pull --store=goveyewear.myshopify.com --theme=160510771450 --nodelete --only config/settings_data.json --only config/settings_schema.json --only "templates/product*.json"`
- Pull staging merchant config (settings + product templates only):
  - `./scripts/shopify theme pull --store=goveyewear.myshopify.com --theme=160581189882 --nodelete --only config/settings_data.json --only config/settings_schema.json --only "templates/product*.json"`
- Push staging (full):
  - `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160581189882 --path . --nodelete`
- Push staging (single file):
  - `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160581189882 --path . --nodelete --only <path>`
- Push live (single file, only after approval):
  - `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160510771450 --path . --nodelete --only <path> --allow-live`

## Local Dev Defaults
- Default dev port: `9292`. If busy, try `9293`, then `9294`, then `9295`.

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

## Settings Safety
- `config/settings_data.json`, `config/settings_schema.json`, and `templates/product*.json` may include merchant-managed configuration.
- Pull/sync first for every Shopify code task, not only when admin changes are expected.
- Avoid accidental overwrite of merchant settings or editor-managed product templates with stale local files.

## Documentation
- Add concise release notes to `CHANGELOG.md` when present.
- If no changelog file exists, provide PR-style change notes in final handoff.

## Non-Negotiables
- Never push to live first.
- Never push to live without explicit user approval in the current thread.
- Always state which theme ID (live or staging) is being targeted before a push.
- If CLI errors, stop and fix tooling before retrying deploys.

## Permissions Note
- Committing and Shopify CLI operations (including launching local dev) may require elevated permissions and can reset Shopify CLI preferences.
- If Shopify CLI preferences are corrupted or blocking progress, remove them automatically.
- The user has granted permission to proceed with these automatically when needed.

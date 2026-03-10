# GovEyewear Theme Agent Rules

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
- If user says they changed admin/theme settings, pull first before making code edits.
- `config/settings_data.json` and `config/settings_schema.json` can carry merchant config; do not overwrite blindly.
- Sync first, then edit.

## Scope Rules
- Prefer small, localized, component-level edits.
- Avoid sweeping theme-wide changes unless user explicitly asks.
- Prefer file-scoped pushes (`--only`) when practical.

## Documentation Rule
- Document shipped changes in `CHANGELOG.md` when present, otherwise provide a concise PR-style change summary in final handoff.

## Skill Usage
- Use `shopify-staging-release` skill from:
  - `.codex/skills/shopify-staging-release/SKILL.md`
- Trigger this skill for any Shopify pull/push/deploy request in this repo.

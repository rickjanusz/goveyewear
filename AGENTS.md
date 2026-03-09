# GovEyewear Theme Agent Rules

## Deploy Protocol (Mandatory)
- Always deploy to staging first: `160581189882`.
- Only deploy to live after explicit approval from user in current thread.
- Live theme ID: `160510771450`.
- Commit before each push.
- Announce target theme ID before running any push command.

## Settings Sync Protocol
- If user says they changed admin/theme settings, pull first before making code edits.
- Do not overwrite settings blindly; sync first, then edit.

## Scope Rules
- Prefer small, localized, component-level edits.
- Avoid sweeping theme-wide changes unless user explicitly asks.
- Prefer file-scoped pushes (`--only`) when practical.

## Skill Usage
- Use `shopify-staging-release` skill from:
  - `.codex/skills/shopify-staging-release/SKILL.md`
- Trigger this skill for any Shopify pull/push/deploy request in this repo.

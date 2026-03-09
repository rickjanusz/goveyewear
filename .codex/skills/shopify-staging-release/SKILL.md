---
name: shopify-staging-release
description: Use this when making Shopify theme changes in this repo. Enforces staging-first deployment, explicit live approval, and commit-per-push workflow.
---

# Shopify Staging Release

## Use This Skill When
- The user asks to edit/push/pull/deploy Shopify theme code.
- The user asks to push to live.
- The user asks to sync admin/theme settings.

## Required Workflow
1. Pull first when requested or when settings may have changed in admin.
2. Make scoped edits only (prefer file-level pushes when possible).
3. Commit before every push.
4. Push to staging theme first.
5. Ask for explicit approval.
6. Push the same commit to live only after approval.

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

## Non-Negotiables
- Never push to live first.
- Never push to live without explicit user approval in the current thread.
- Always state which theme ID (iteration(live or staging)) is being targeted before a push.
- If CLI errors, stop and fix tooling before retrying deploys.

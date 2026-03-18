# GovEyewear Theme Worklog

Keep this file updated so any agent can resume without overwriting files.

## Current State
- Branch: codex/mega-menu-3stage
- HEAD commit: c62def437a709302e865813f776dbf45eec5c2f0
- Last pushed commit (GitHub): c62def437a709302e865813f776dbf45eec5c2f0
- Local dev server:
  - Running? no
  - Port:
- Last theme targets:
  - Staging: 160581189882
  - Live: 160510771450

## Recent Pulls
- 2026-03-18: `./scripts/shopify theme pull --store=goveyewear.myshopify.com --theme=160510771450 --nodelete`
  - Intent: overwrite local with current live theme baseline
  - Result: success, no tracked local diffs after pull

## Recent Pushes
- 2026-03-18: target theme ID `160581189882` (staging)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160581189882 --path . --nodelete`
  - Files pushed: full theme (overwrite staging to match live/local baseline)
  - Note: Shopify CLI preferences were reset (`rm -rf /Users/p/Library/Preferences/shopify-cli-theme-conf-nodejs`) before successful push due local storage error
- 2026-03-18: target theme ID `160581189882` (staging)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160581189882 --path . --nodelete --only assets/featured-collection-mega-menu.js`
  - Files pushed: `assets/featured-collection-mega-menu.js`
  - Change: main menu final breadcrumb now uses selected frame title (`{{frame}}`) as non-link text
- 2026-03-18: target theme ID `160510771450` (live)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160510771450 --path . --nodelete --only assets/featured-collection-mega-menu.js --allow-live`
  - Files pushed: `assets/featured-collection-mega-menu.js`
  - Change: promoted same breadcrumb fix from staging to live

## Previews
- Staging preview: https://goveyewear.myshopify.com?preview_theme_id=160581189882
- Live preview: https://goveyewear.myshopify.com

## Open TODOs / Approvals Needed
- None currently. Live push not requested in this sync step.

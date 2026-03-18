# GovEyewear Theme Worklog

Keep this file updated so any agent can resume without overwriting files.

## Current State
- Branch: codex/mega-menu-3stage
- HEAD commit: ff410baa3f0bb0a59cc078f18e2e11c7d658e992
- Last pushed commit (GitHub): 350ccef643630f9f5b8f8a4aa16e6032ea5bcc9b
- Local dev server:
  - Running? no
  - Port:
- Last theme targets:
  - Staging: 160581189882
  - Live: 160510771450

## Recent Pulls
- 2026-03-18: `./scripts/shopify theme pull --store=goveyewear.myshopify.com --theme=160510771450 --nodelete --only config/settings_data.json --only config/settings_schema.json`
  - Intent: settings-only sync from live after admin updates
  - Result: success
  - Files updated: `config/settings_data.json` (favicon changed to `shopify://shop_images/favicon.png`), `config/settings_schema.json` unchanged
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
- 2026-03-18: target theme ID `160581189882` (staging)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160581189882 --path . --nodelete --only assets/base.css`
  - Files pushed: `assets/base.css`
  - Change: removed global `.page-width` max-width restraint while preserving section padding
- 2026-03-18: target theme ID `160581189882` (staging)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160581189882 --path . --nodelete --only sections/product-recommendations.liquid`
  - Files pushed: `sections/product-recommendations.liquid`
  - Change: product accordion now supports structured metaobject refs (with fallback), optional bullets list, and optional video rendering in Media + Callouts
- 2026-03-18: target theme ID `160510771450` (live)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160510771450 --path . --nodelete --only sections/product-recommendations.liquid --allow-live`
  - Files pushed: `sections/product-recommendations.liquid`
  - Change: promoted structured accordion + optional Media/Callouts video support to live
- 2026-03-18: target theme ID `160581189882` (staging)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160581189882 --path . --nodelete --only sections/product-recommendations.liquid`
  - Files pushed: `sections/product-recommendations.liquid`
  - Change: Media + Callouts accordion now defaults open when populated
- 2026-03-18: target theme ID `160510771450` (live)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160510771450 --path . --nodelete --only sections/product-recommendations.liquid --allow-live`
  - Files pushed: `sections/product-recommendations.liquid`
  - Change: promoted Media + Callouts default-open behavior to live
- 2026-03-18: target theme ID `160581189882` (staging)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160581189882 --path . --nodelete --only locales/en.default.json`
  - Files pushed: `locales/en.default.json`
  - Change: product CTA label changed from “Choose options” to “Equip Now”
- 2026-03-18: target theme ID `160510771450` (live)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160510771450 --path . --nodelete --only locales/en.default.json --allow-live`
  - Files pushed: `locales/en.default.json`
  - Change: promoted “Equip Now” CTA label to live
- 2026-03-18: target theme ID `160581189882` (staging)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160581189882 --path . --nodelete --only sections/product-recommendations.liquid --only locales/en.default.json`
  - Files pushed: `sections/product-recommendations.liquid`, `locales/en.default.json`
  - Change: Media + Callouts video now autoplay/loop/muted/playsinline; all “View all” labels changed to “Full Arsenal”; sold-out text changed to “All Units Deployed”
- 2026-03-18: target theme ID `160510771450` (live)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160510771450 --path . --nodelete --only sections/product-recommendations.liquid --only locales/en.default.json --allow-live`
  - Files pushed: `sections/product-recommendations.liquid`, `locales/en.default.json`
  - Change: promoted same autoplay + tactical label updates to live

## Previews
- Staging preview: https://goveyewear.myshopify.com?preview_theme_id=160581189882
- Live preview: https://goveyewear.myshopify.com

## Open TODOs / Approvals Needed
- None currently. Live push not requested in this sync step.

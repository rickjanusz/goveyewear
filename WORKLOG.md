# GovEyewear Theme Worklog

Keep this file updated so any agent can resume without overwriting files.

## Current State
- Branch: codex/mega-menu-3stage
- HEAD commit: 62f7162f71ff268508645a6b40f4692f50cbe0c6
- Last pushed commit (GitHub): 62f7162f71ff268508645a6b40f4692f50cbe0c6
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
- 2026-03-19: target theme ID `160581189882` (staging)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160581189882 --path . --nodelete --only sections/featured-collection.liquid`
  - Files pushed: `sections/featured-collection.liquid`
  - Change: removed `detail_button_link` fallback from main View All/Full Arsenal link to prevent brand-page button hijack
- 2026-03-19: GitHub sync
  - Command: `git push origin codex/mega-menu-3stage`
  - Commit range: `9731c57..62f7162`
- 2026-03-19: target theme ID `160510771450` (live)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160510771450 --path . --nodelete --allow-live --only sections/featured-collection.liquid`
  - Files pushed: `sections/featured-collection.liquid`
  - Change: capped featured product carousel output at 15 cards to reduce DOM/media payload
- 2026-03-19: GitHub sync
  - Command: `git push origin codex/mega-menu-3stage`
  - Commit range: `27f74b1..f40057d`
- 2026-03-19: target theme ID `160510771450` (live)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160510771450 --path . --nodelete --allow-live --only sections/brand-video.liquid`
  - Files pushed: `sections/brand-video.liquid`
  - Change: promoted mobile-specific hosted video source support (`video_mobile`) to live
- 2026-03-19: target theme ID `160581189882` (staging)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160581189882 --path . --nodelete --only sections/brand-video.liquid`
  - Files pushed: `sections/brand-video.liquid`
  - Change: added optional `Hosted mobile video` setting and responsive mobile-first `<source media>` handling for brand video section
- 2026-03-19: target theme ID `160510771450` (live)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160510771450 --path . --nodelete --allow-live --only assets/captions-placeholder.vtt --only sections/brand-video.liquid --only sections/image-banner.liquid`
  - Files pushed: `assets/captions-placeholder.vtt`, `sections/brand-video.liquid`, `sections/image-banner.liquid`
  - Change: promoted Lighthouse accessibility + video delivery fixes to live
- 2026-03-19: target theme ID `160510771450` (live)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160510771450 --path . --nodelete --allow-live --only sections/product-recommendations.liquid`
  - Files pushed: `sections/product-recommendations.liquid`
  - Change: promoted Media + Callouts MP4-first video render + captions track placeholder to live
- 2026-03-19: target theme ID `160581189882` (staging)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160581189882 --path . --nodelete --only assets/captions-placeholder.vtt --only sections/brand-video.liquid --only sections/image-banner.liquid`
  - Files pushed: `assets/captions-placeholder.vtt`, `sections/brand-video.liquid`, `sections/image-banner.liquid`
  - Change: Lighthouse fixes (guaranteed banner alt text, MP4-first hosted brand video rendering with captions track placeholder)
- 2026-03-19: target theme ID `160581189882` (staging)
  - Command: `./scripts/shopify theme push --store=goveyewear.myshopify.com --theme=160581189882 --path . --nodelete --only sections/product-recommendations.liquid`
  - Files pushed: `sections/product-recommendations.liquid`
  - Change: Media + Callouts hosted video now uses MP4-first rendering with captions track placeholder
- 2026-03-19: GitHub sync
  - Command: `git push origin codex/mega-menu-3stage`
  - Commit range: `fbefdd2..878aa06`
  - PR: `https://github.com/rickjanusz/goveyewear/pull/1`
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

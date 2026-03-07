# goveyewear Shopify Theme

## What is set up

- Git repository initialized in this folder.
- Shopify CLI installed (`3.91.1`).
- `scripts/shopify` wrapper added so CLI always runs with Node 20.

## One-time setup

1. Add your Git remote:
   - `git remote add origin <your-git-repo-url>`
2. Create first commit:
   - `git add . && git commit -m "Initial Shopify theme import"`
3. Push:
   - `git push -u origin main`

## Connect to Shopify

1. Authenticate:
   - `./scripts/shopify auth login --store your-store.myshopify.com`
2. Start local development (live preview URL + hot reload):
   - `./scripts/shopify theme dev --store your-store.myshopify.com`

## Useful commands

- Pull theme from store: `./scripts/shopify theme pull --store your-store.myshopify.com --theme <THEME_ID>`
- Develop specific theme: `./scripts/shopify theme dev --store your-store.myshopify.com --theme <THEME_ID>`
- Push changes: `./scripts/shopify theme push --store your-store.myshopify.com --theme <THEME_ID>`

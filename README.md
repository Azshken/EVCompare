# EVCompare

Web app that calculates EV vs petrol running costs and financing options.

Live demo: https://evcompare-seven.vercel.app (will move to evcompare.io)

## Features

- EV vs combustion running-cost comparison (includes oil service)
- Loan calculator that factors in monthly EV savings
- Shared state between views with smooth transitions
- Lead capture form
- Dark / light theme
- Persistent inputs via localStorage

## Deploy to Cloudflare Pages

This is a static Vite + React app — perfect for Cloudflare Pages.

1. Connect the GitHub repo (`Azshken/EVCompare`) to Cloudflare Pages.
2. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** 20 or higher (set in Pages environment or `.nvmrc`)
3. Add custom domain `evcompare.io` in the Cloudflare Pages project (you handle DNS).
4. No special redirects needed — it’s a single-page app with no client-side routes.

Optional: set `NODE_VERSION=20` in Cloudflare Pages environment variables.

## Local development

```bash
npm install
npm run dev
```

## Project structure

- `src/components/voltcalc/` — running cost calculator
- `src/components/loancalc/` — financing calculator
- `src/utils/` — calculation logic
- `src/styles/` — global styles

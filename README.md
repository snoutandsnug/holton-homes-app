# Holton Homes Business Builder

Upload the contents of this folder to the root of the `holton-homes-app` repository.

## Included
- `index.html` — the app
- `404.html` — fallback page
- `manifest.webmanifest` — installable web-app settings
- `service-worker.js` — offline caching
- `.nojekyll` — GitHub Pages compatibility
- `.github/workflows/pages.yml` — automatic GitHub Pages deployment
- `assets/pip.jpg` — the plush Pip reference used in the app

## GitHub Pages
After uploading, open the repository's **Settings → Pages** and set **Source** to **GitHub Actions**.

This build stores CRM data in the browser on the device being used. It is not yet a secure cloud database and does not sync automatically across devices.

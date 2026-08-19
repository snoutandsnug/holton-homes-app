# Manual / GitHub Website Install

There are two supported install paths.

## A. Safer when you have a local repo — installer

Run `INSTALL_WINDOWS.bat`, paste the repository root, and let the installer patch the then-current `index.html` and `service-worker.js`.

This is the preferred path if `main` has changed after this package was built.

## B. Easiest through GitHub's website — upload-ready

The `upload-ready/` directory contains five complete files prepared against the exact current main baseline used for this build:

`c019de9ec36bcf3f79921097f25d3b19683e399b`

On a **fresh branch from that commit**, upload/replace:

- `index.html`
- `service-worker.js`
- `holton-studio-engine.js`
- `holton-studio.js`
- `holton-studio.css`

Then wait for the Vercel preview and run `TEST_PLAN.md`.

Do not use those ready-patched shell files if main has moved. Use the installer instead so it patches the new shell rather than replacing newer work.

## What the integration changes

`index.html` receives:

```html
<link rel="stylesheet" href="./holton-studio.css?v=1">
...
<script src="./holton-studio-engine.js?v=1"></script>
<script src="./holton-studio.js?v=1"></script>
```

The engine script must load before the Studio UI script.

`service-worker.js` receives the three Studio assets and a new cache name so a stale PWA cache does not hide the update.

`app.js` is deliberately untouched.

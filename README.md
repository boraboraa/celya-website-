# celya.be — static site

Static HTML/CSS/JS, no build step. Deploy from this directory: `vercel --prod`.

- `index.html` — single-product homepage for Janet (EN). FR/NL rebuilds pending.
- `dark.css` / `dark.js` — shared theme + behavior. GTM (GTM-KF9QCKB2) loads
  ONLY after cookie consent (localStorage key `celya-consent`) — keep it that way.
- `assets/janet-*.png` — the real Janet renders (square derived from hero).
- `vercel.json` — 301s for the removed service pages (services, -crm, -sales, -admin).
- Talk-to-Janet floating widget is injected on every page by `dark.js`.

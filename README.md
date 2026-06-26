# PDF.tools

A free, fast, **100% client-side** PDF toolkit. Merge, split, compress, convert,
rotate, organize and watermark PDFs - all processing happens in the user's browser,
so files are never uploaded. Zero backend = zero hosting cost.

## Why this makes money

- **No operating cost.** Static site on Vercel/Netlify/Cloudflare Pages = $0/mo.
- **Privacy is the hook.** "Files never leave your device" converts and ranks.
- **Built-in monetization:** ads, donations, and a one-time Pro upsell.
- **High-intent search traffic.** "merge pdf", "compress pdf", "jpg to pdf"
  get millions of searches/month.

## Tools included

| Tool | What it does |
|------|--------------|
| Merge PDF | Combine multiple PDFs into one |
| Split PDF | Extract a page range |
| Compress PDF | Shrink file size (rasterize) |
| PDF to JPG | Export each page as an image |
| JPG to PDF | Combine images into a PDF |
| Rotate PDF | Rotate all pages 90/180/270 |
| Delete Pages | Visually remove pages |
| Watermark PDF | Stamp text across all pages |

## Run locally

Just open `index.html` in a browser. Or serve it:

```bash
npx serve .
# or
python -m http.server 8080
```

## Deploy (free)

### Vercel
```bash
npm i -g vercel
vercel        # follow prompts, framework = Other, output dir = .
```

### Netlify
Drag the folder into https://app.netlify.com/drop

### Cloudflare Pages
- Connect repo, build command: (none), output dir: `.`

## Monetization setup

1. **Ads** - Open `index.html`, find `<!-- AD SLOT -->`, paste your AdSense
   (or Ezoic / Mediavine once you hit traffic) snippet.
2. **Donations** - Edit the `Buy me a coffee` link in the CTA band.
3. **Pro upsell** - In `js/app.js` find `openProModal`, set the Gumroad/Stripe link.

## Getting traffic

- Submit `sitemap.xml` to Google Search Console.
- Build backlinks: Reddit, Product Hunt, Hacker News, dev forums.
- Write one SEO landing page per tool keyword over time.

## Tech

- `pdf-lib` (create/edit PDFs) + `pdf.js` (render pages) via CDN.
- Vanilla JS SPA, no build step.
- ~30 KB of custom JS. Loads instantly.

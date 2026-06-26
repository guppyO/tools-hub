# Tools Hub

25+ free, fast, **100% client-side** online tools. PDF, image, text and developer utilities — all processing happens in the browser, so files are never uploaded. Zero backend = zero hosting cost.

**Live:** https://guppyo.github.io/tools-hub/

## Tools (25)

### PDF (8)
Merge · Split · Compress · PDF to JPG · JPG to PDF · Rotate · Delete Pages · Watermark

### Image (5)
Image Compressor · Image Converter · Image Resizer · QR Code Generator · Image to Base64

### Text (5)
Word Counter · Case Converter · Lorem Ipsum · Text Diff · Slug Generator

### Developer (7)
JSON Formatter · Base64 Encode/Decode · URL Encode/Decode · JWT Decoder · Hash Generator · Color Converter · UUID Generator

## Why this makes money
- **Zero operating cost** — static site, free hosting on GitHub Pages.
- **Privacy hook** — "files never leave your device" converts and ranks.
- **Broad keyword coverage** — 25 tools = 25 keyword targets.
- **Monetization built in** — ad slots, donation CTA, Pro upsell modal.

## Run locally
```bash
npx serve .
# or
python -m http.server 8080
```

## Deploy
Already deployed via GitHub Pages on push to `main`. Configured at:
https://github.com/guppyO/tools-hub/settings/pages

## Monetization setup
1. **Ads** — `index.html`, find `<!-- AD SLOT -->`, paste AdSense snippet.
2. **Donations** — edit the "Buy me a coffee" link in the CTA band.
3. **Pro** — `js/app.js` → `openProModal`, set Gumroad/Stripe link.

## Tech
- `pdf-lib` + `pdf.js` (PDF) + `qrcode` — all via CDN.
- Vanilla JS SPA, no build step.
- ~80 KB custom code across 5 JS files.

## Traffic
- Sitemap submitted to Google Search Console.
- Each tool targets a high-intent search keyword.

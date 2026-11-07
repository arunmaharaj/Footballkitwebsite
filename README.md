# Football Kit Shop (browse-only)

A catalogue website for a football kit shop in Trinidad & Tobago. No checkout, payments or accounts: visitors browse by league and team, pick a size, and tap **Enquire on WhatsApp**, which opens WhatsApp with a message ready to send.

- **Featured rail** at the top: an interactive clothes rail of up to 8 kits marked `"featured": true`.
- **Catalogue** below: league tabs, team / kit type / size / price / in-stock filters, search, sort, shareable links (`?league=La+Liga&team=Barcelona`, `?kit=tt-home-2026`).

Built with Vite, React, TypeScript, Tailwind CSS and the shadcn project structure. Deploys free on Netlify.

## Shop details

Edit `src/config.ts`: shop name, tagline, WhatsApp number (digits only, starting `1868`), Instagram.

## Add a kit: edit `kits.json` only

1. Put the photo in `public/images/kits/` (square JPG/PNG/WebP, about 800×800).
2. Copy an entry in `kits.json`, paste it, and change the values:

```json
{
  "id": "tt-home-2026",
  "name": "Trinidad & Tobago Home Shirt",
  "team": "Trinidad & Tobago",
  "league": "International",
  "season": "2026",
  "type": "home",
  "price": 450,
  "sizes": ["S", "M", "L", "XL"],
  "image": "images/kits/tt-home-2026.jpg",
  "description": "Short description shown on the kit page.",
  "inStock": true,
  "featured": true,
  "color": "#c8102e",
  "trim": "#111111"
}
```

| Field | Notes |
|---|---|
| `id` | Unique; lowercase letters, numbers and dashes. |
| `league`, `team` | New leagues and teams appear in the tabs and filters automatically. |
| `type` | `home`, `away`, `third` or `retro`. |
| `price` | Number in TTD (no `$`). |
| `inStock` | `false` shows a "Sold out" label and an "Ask about restock" button. |
| `featured` | Optional. `true` hangs the kit on the rail (first 8 are used). |
| `color`, `trim` | Optional. Shirt colours used to draw the kit on the rail. |
| `cutout`, `cutoutBack` | Optional. Transparent cut-out photos (200×310 portrait canvas) to show on the rail instead of the drawing. |

A missing comma or quote breaks the build; paste the file into https://jsonlint.com if unsure. Netlify shows the error and keeps the old version live.

## Run it on your computer

```bash
npm install
```

```bash
npm run dev
```

## Deploy on Netlify (free)

New site → Import from GitHub → pick this repo. `netlify.toml` already sets the build command (`npm run build`) and publish folder (`dist`). Every push to `main` redeploys.

## Project layout

```
kits.json                                  the catalogue
src/config.ts                              shop name, WhatsApp number
src/App.tsx                                page layout, filter state
src/components/catalog/                    header, league tabs, filters, cards, kit popup, featured rail
src/components/ui/product-rail-gallery.tsx clothing rail component (shadcn ui folder)
src/lib/kits.ts                            filtering, sorting, WhatsApp messages
src/index.css                              Tailwind + shadcn theme colours
public/images/kits/                        kit photos (current ones are drawn placeholders)
```

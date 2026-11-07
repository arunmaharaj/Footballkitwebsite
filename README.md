# Football Kit Shop (browse-only)

A static website for browsing football kits in Trinidad & Tobago. There's no checkout, no payments and no accounts. Visitors browse, pick a size, and tap **Enquire on WhatsApp**, which opens WhatsApp with a message that's already filled in.

Plain HTML, CSS and JavaScript. No build step, no backend, no database.

## Set your shop details

Edit **`js/config.js`**:

```js
name: "Kit Shop TT",
whatsapp: "1868XXXXXXX",   // digits only, starting 1868, e.g. "18681234567"
```

## Add a kit (the only file you edit is `kits.json`)

1. Put the photo in `images/kits/` (JPG, PNG or WebP; square photos look best, about 800×800).
2. Open `kits.json` and copy an existing entry. Paste it in, add a comma between entries, and change the values:

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
  "inStock": true
}
```

| Field | Notes |
|---|---|
| `id` | Unique. Lowercase letters, numbers and dashes. Used in share links (`?kit=tt-home-2026`). |
| `type` | One of `home`, `away`, `third`, `retro`. |
| `price` | Number in TTD, no `$` or quotes. |
| `sizes` | List of sizes in quotes. |
| `inStock` | `true` or `false`. Sold-out kits still show, with a "Sold out" stamp and an "Ask about restock" button. |

New leagues and sizes appear in the filters automatically. Kits show in the order they appear in the file (in-stock first).

**Check your JSON:** a missing comma or quote breaks the whole catalogue. Paste the file into https://jsonlint.com before saving if you're unsure.

You can edit `kits.json` and upload photos straight on GitHub (**Add file → Upload files**). Netlify redeploys automatically within a minute.

## Preview on your computer

`fetch` doesn't work when you open the file directly, so run a tiny local server from this folder:

```bash
npx serve .
```

## Deploy on Netlify (free)

1. On netlify.com: **Add new site → Import an existing project → GitHub**, then pick this repository.
2. Leave the build command empty. The publish directory is `.` (already set in `netlify.toml`).
3. Deploy. Every change pushed to `main` goes live automatically.

## Files

```
index.html          page
css/styles.css      design (retro matchday programme)
js/config.js        shop name, WhatsApp number
js/app.js           filters, kit popup, WhatsApp links
kits.json           the catalogue
images/kits/        kit photos (the included shirt drawings are placeholders)
netlify.toml        Netlify settings
```

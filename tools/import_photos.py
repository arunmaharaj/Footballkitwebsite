"""Turn the downloaded Drive photos into web images + kits.json.

Usage: python3 -I build_catalog.py <photos_dir> <repo_dir>
"""
import json, os, re, sys
from collections import defaultdict
import numpy as np
from PIL import Image, ImageOps

SRC, REPO = sys.argv[1], sys.argv[2]
OUT = os.path.join(REPO, "public/images/test-photos")
for d in ("kits", "rail", "badges", "leagues"):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)

# ---------- team metadata: slug -> (display name, league tab, sub-group, badge file) ----------
T = {}
def add(league, sub, rows):
    for slug, name, badge in rows:
        T[slug] = (name, league, sub, badge)

L = lambda c, t: f"{c}_{t}_512x512.football-logos.cc.png"
add("Premier League", None, [
    ("arsenal-fc", "Arsenal", L("england", "arsenal")),
    ("aston-villa", "Aston Villa", L("england", "aston-villa")),
    ("chelsea-fc", "Chelsea", L("england", "chelsea")),
    ("liverpool-fc", "Liverpool", L("england", "liverpool")),
    ("manchester-city", "Manchester City", L("england", "manchester-city")),
    ("manchester-united", "Manchester United", L("england", "manchester-united")),
    ("tottenham-hotspur", "Tottenham Hotspur", L("england", "tottenham")),
])
add("La Liga", None, [
    ("atletico-madrid", "Atlético Madrid", L("spain", "atletico-madrid")),
    ("fc-barcelona", "Barcelona", L("spain", "barcelona")),
    ("real-madrid", "Real Madrid", L("spain", "real-madrid")),
])
add("Serie A", None, [
    ("ac-milan", "AC Milan", L("italy", "milan")),
    ("acf-fiorentina", "Fiorentina", L("italy", "fiorentina")),
    ("as-roma", "Roma", L("italy", "roma")),
    ("como-1907", "Como 1907", L("italy", "como-1907")),
    ("inter-milan", "Inter Milan", L("italy", "inter")),
    ("juventus-fc", "Juventus", L("italy", "juventus")),
    ("ssc-napoli", "Napoli", L("italy", "napoli")),
])
add("Bundesliga", None, [
    ("bayer-04-leverkusen", "Bayer Leverkusen", L("germany", "bayer-leverkusen")),
    ("bayern-munchen", "Bayern Munich", L("germany", "bayern-munchen")),
    ("borussia-dortmund", "Borussia Dortmund", L("germany", "borussia-dortmund")),
    ("rb-leipzig", "RB Leipzig", L("germany", "rb-leipzig")),
])
add("Ligue 1", None, [
    ("as-monaco", "AS Monaco", L("france", "as-monaco")),
    ("olympique-lyonnais", "Lyon", L("france", "lyon")),
    ("olympique-marseille", "Marseille", L("france", "marseille")),
    ("paris-saint-germain", "Paris Saint-Germain", L("france", "paris-saint-germain")),
])
add("Other Leagues", "Eredivisie", [
    ("ajax-amsterdam", "Ajax", L("netherlands", "ajax")),
    ("feyenoord", "Feyenoord", L("netherlands", "feyenoord")),
    ("psv", "PSV", L("netherlands", "psv")),
])
add("Other Leagues", "Primeira Liga", [
    ("fc-porto", "FC Porto", L("portugal", "fc-porto")),
    ("sl-benfica", "Benfica", L("portugal", "benfica")),
    ("sporting-cp", "Sporting CP", L("portugal", "sporting-cp")),
])
add("Other Leagues", "Süper Lig", [
    ("besiktas", "Beşiktaş", L("turkey", "besiktas")),
    ("galatasaray", "Galatasaray", L("turkey", "galatasaray")),
    ("trabzonspor", "Trabzonspor", L("turkey", "trabzonspor")),
])
add("Other Leagues", "Saudi Pro League", [
    ("al-hilal-sfc", "Al Hilal", L("saudi-arabia", "al-hilal")),
    ("al-nassr-fc", "Al Nassr", L("saudi-arabia", "al-nassr")),
])
add("Other Leagues", "MLS", [
    ("chicago-fire", "Chicago Fire", L("usa", "chicago-fire-fc")),
    ("inter-miami", "Inter Miami", L("usa", "inter-miami-cf")),
    ("la-galaxy", "LA Galaxy", L("usa", "la-galaxy")),
    ("los-angeles-fc", "Los Angeles FC", L("usa", "los-angeles-fc")),
    ("orlando-city", "Orlando City", L("usa", "orlando-city")),
])
add("Other Leagues", "Brazil Série A", [
    ("palmeiras", "Palmeiras", L("brazil", "palmeiras")),
    ("santos-fc", "Santos", L("brazil", "santos")),
])
add("Other Leagues", "Argentina Primera División", [
    ("boca-juniors", "Boca Juniors", L("argentina", "boca-juniors")),
    ("river-plate", "River Plate", L("argentina", "river-plate")),
])
add("International", "UEFA", [
    ("belgium", "Belgium", "Belgium.png"), ("croatia", "Croatia", "Croatia.png"), ("england", "England", "England.png"),
    ("france", "France", "France.png"), ("germany", "Germany", "Germany.png"), ("italy", "Italy", "Italy.png"),
    ("netherlands", "Netherlands", "Netherlands.png"), ("norway", "Norway", L("norway", "norway-national-team")),
    ("portugal", "Portugal", L("portugal", "portuguese-football-federation")), ("spain", "Spain", "Spain.png"),
])
add("International", "CONMEBOL", [
    ("argentina", "Argentina", "Argentina.png"), ("brazil", "Brazil", "Brazil.png"), ("chile", "Chile", "Chile.png"),
    ("colombia", "Colombia", "Colombia.png"), ("uruguay", "Uruguay", "Uruguay.png"),
])
add("International", "CONCACAF", [
    ("canada", "Canada", "Canada.png"), ("jamaica", "Jamaica", "Jamaica.png"), ("mexico", "Mexico", "mEXICO.png"), ("usa", "USA", "US.png"),
])
add("International", "CAF", [
    ("algeria", "Algeria", "Algeria.gif"), ("egypt", "Egypt", "Egypt.gif"), ("ivory-coast", "Ivory Coast", "Ivory Coast.gif"),
    ("morocco", "Morocco", "Morocco.gif"), ("nigeria", "Nigeria", "Nigeria.gif"), ("senegal", "Senegal", "Senegal.gif"),
])
add("International", "AFC", [
    ("japan", "Japan", "Japan.png"), ("south-korea", "South Korea", "S Korea.png"),
])

LEAGUE_LOGOS = {
    "Premier League": "pl.png", "La Liga": "la liga.png", "Serie A": "serie a.png", "Bundesliga": "bundes.png",
    "Ligue 1": "ligue 1.png", "Other Leagues": "other leagues.png", "International": None,
    "UEFA": "UEFA.png", "CONMEBOL": "Conmebol.gif", "CONCACAF": "CONCACAF.png", "CAF": "Caf.gif", "AFC": "AFC SportLogos.net.png",
    "Eredivisie": L("netherlands", "eredivisie"), "Primeira Liga": L("portugal", "primeira-liga"), "Süper Lig": L("turkey", "super-lig"),
    "Saudi Pro League": L("saudi-arabia", "saudi-professional-league"), "MLS": L("usa", "mls"),
    "Brazil Série A": L("brazil", "brazilian-serie-a"), "Argentina Primera División": L("argentina", "argentina-primera-division"),
}

# ---------- parse kit photo names ----------
KIT = re.compile(r"^(?P<team>.+?)-(?P<season>\d{4}(?:-\d{2})?)-(?P<rest>.+?)-kit(?P<back> \(1\))?\.(?:jpe?g|png|webp)$", re.I)
kits = defaultdict(dict)  # (team, season, rest) -> {"front": path, "back": path}
for f in sorted(os.listdir(SRC)):
    m = KIT.match(f)
    if not m:
        continue
    team, season, rest = m["team"], m["season"], m["rest"]
    if team == "como":  # "como-1907-2026-27-away-kit"
        team, mm = "como-1907", re.match(r"(\d{4}-\d{2})-(.+)", rest)
        season, rest = mm.group(1), mm.group(2)
    kits[(team, season, rest)]["back" if m["back"] else "front"] = os.path.join(SRC, f)

# River Plate photos were named by hand
for rest, front, back in [("home", "River Home.jpeg", "river home back.jpeg"), ("away", "River Away.jpeg", "River away back.jpeg")]:
    kits[("river-plate", "2026-27", rest)] = {"front": os.path.join(SRC, front), "back": os.path.join(SRC, back)}

def season_label(s):
    return s.replace("-", "/") if "-" in s else s

def year(s):
    return int(s[:4])

def classify(rest, season):
    """-> (type, label used in the kit name)"""
    label = {
        "home": "Home", "away": "Away", "third": "Third", "fourth": "Fourth", "fifth": "Fifth", "home-v2": "Home (Alt)",
        "pre-season-away": "Pre-Season Away", "centenary": "Centenary", "anniversary": "Anniversary",
        "copa-america-home": "Copa América Home", "centenary-home": "Centenary Home",
    }.get(rest, rest.replace("-", " ").title())
    if year(season) < 2020:
        return "retro", label
    if rest in ("home", "away", "third", "home-v2"):
        return ("home" if rest == "home-v2" else rest), label
    return "special", label

# ---------- image helpers ----------
def load(path):
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)
    return im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")

def save_web(im, dest, size=900):
    im = im.copy()
    im.thumbnail((size, size), Image.LANCZOS)
    if im.mode == "RGBA":
        bg = Image.new("RGB", im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[3]); im = bg
    im.save(dest, "WEBP", quality=82, method=6)

def cutout(path, dest, W=400, H=620):
    """Remove a plain studio background (flood fill from the edges) and place the shirt on the rail's 200x310 canvas."""
    im = load(path).convert("RGB")
    im.thumbnail((900, 900), Image.LANCZOS)
    a = np.asarray(im).astype(np.int16)
    h, w, _ = a.shape
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(border, axis=0)
    close = (np.abs(a - bg).max(axis=2) < 26)
    # flood fill the background region connected to the border
    mask = np.zeros((h, w), bool)
    stack = [(y, x) for x in range(w) for y in (0, h - 1)] + [(y, x) for y in range(h) for x in (0, w - 1)]
    while stack:
        y, x = stack.pop()
        if 0 <= y < h and 0 <= x < w and not mask[y, x] and close[y, x]:
            mask[y, x] = True
            stack.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
    alpha = Image.fromarray(np.where(mask, 0, 255).astype(np.uint8)).filter(__import__("PIL.ImageFilter", fromlist=["x"]).GaussianBlur(0.8))
    rgba = im.convert("RGBA"); rgba.putalpha(alpha)
    box = rgba.getbbox()
    if not box:
        return False
    shirt = rgba.crop(box)
    fg = 1 - mask.mean()
    if fg < 0.15 or fg > 0.92:
        return False  # background removal failed (e.g. white shirt on white)
    # fit shirt: full width, top of collar just under the hook
    scale = min(W * 0.98 / shirt.width, H * 0.80 / shirt.height)
    shirt = shirt.resize((max(1, int(shirt.width * scale)), max(1, int(shirt.height * scale))), Image.LANCZOS)
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.alpha_composite(shirt, ((W - shirt.width) // 2, int(H * 0.085)))
    canvas.save(dest, "WEBP", quality=85, method=6)
    return True

# ---------- build ----------
FEATURED = {
    ("arsenal-fc", "2026-27", "home"), ("real-madrid", "2026-27", "home"), ("fc-barcelona", "2026-27", "home"),
    ("ac-milan", "2026-27", "home"), ("bayern-munchen", "2026-27", "home"), ("paris-saint-germain", "2026-27", "home"),
    ("argentina", "2026", "home"), ("brazil", "2026", "home"),
}
LEAGUE_ORDER = ["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1", "Other Leagues", "International"]
TYPE_ORDER = {"home": 0, "away": 1, "third": 2, "special": 3, "retro": 4}

entries, missing, skipped = [], set(), []
for (team, season, rest), files in kits.items():
    if team not in T:
        missing.add(team); continue
    if "front" not in files:
        skipped.append((team, season, rest)); continue
    name, league, sub, _ = T[team]
    ktype, label = classify(rest, season)
    kid = f"{team}-{season}-{rest}"
    save_web(load(files["front"]), os.path.join(OUT, "kits", f"{kid}.webp"))
    e = {
        "id": kid,
        "name": f"{name} {season_label(season)} {label} Shirt",
        "team": name,
        "league": league,
        **({"group": sub} if sub else {}),
        "season": season_label(season),
        "type": ktype,
        "price": 0,
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "image": f"images/test-photos/kits/{kid}.webp",
        "description": "",
        "inStock": True,
    }
    if "back" in files:
        save_web(load(files["back"]), os.path.join(OUT, "kits", f"{kid}-back.webp"))
        e["imageBack"] = f"images/test-photos/kits/{kid}-back.webp"
    current = year(season) >= 2025
    e["price"] = 450 if current and ktype != "retro" else (375 if ktype == "retro" else 400)
    if (team, season, rest) in FEATURED:
        ok = cutout(files["front"], os.path.join(OUT, "rail", f"{kid}.webp"))
        okb = "back" in files and cutout(files["back"], os.path.join(OUT, "rail", f"{kid}-back.webp"))
        if ok:
            e["featured"] = True
            e["cutout"] = f"images/test-photos/rail/{kid}.webp"
            if okb:
                e["cutoutBack"] = f"images/test-photos/rail/{kid}-back.webp"
    entries.append(e)

entries.sort(key=lambda e: (LEAGUE_ORDER.index(e["league"]), e.get("group") or "", e["team"], -year(e["season"]), TYPE_ORDER[e["type"]], e["id"]))

# ---------- badges & league logos ----------
badges, logos = {}, {}
def logo_png(src, dest, size=160):
    im = load(os.path.join(SRC, src)).convert("RGBA")
    im.thumbnail((size, size), Image.LANCZOS)
    im.save(dest, "PNG", optimize=True)
for slug, (name, league, sub, badge) in T.items():
    if badge and os.path.exists(os.path.join(SRC, badge)):
        logo_png(badge, os.path.join(OUT, "badges", f"{slug}.png"), 96)
        badges[name] = f"images/test-photos/badges/{slug}.png"
for lg, src in LEAGUE_LOGOS.items():
    if src and os.path.exists(os.path.join(SRC, src)):
        slug = re.sub(r"[^a-z0-9]+", "-", lg.lower()).strip("-")
        logo_png(src, os.path.join(OUT, "leagues", f"{slug}.png"), 128)
        logos[lg] = f"images/test-photos/leagues/{slug}.png"

json.dump(entries, open(os.path.join(REPO, "kits.json"), "w"), indent=2, ensure_ascii=False)
json.dump({"badges": badges, "leagues": logos}, open(os.path.join(REPO, "logos.json"), "w"), indent=2, ensure_ascii=False)
print("kits", len(entries), "featured", sum(1 for e in entries if e.get("featured")), "with back", sum(1 for e in entries if "imageBack" in e))
print("by league", {lg: sum(1 for e in entries if e["league"] == lg) for lg in LEAGUE_ORDER})
print("by type", {t: sum(1 for e in entries if e["type"] == t) for t in TYPE_ORDER})
print("unmapped teams", missing, "no front photo", skipped)
print("badges", len(badges), "league logos", len(logos))

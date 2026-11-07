import raw from "../../kits.json";
import logos from "../../logos.json";
import { SHOP } from "@/config";

export type KitType = "home" | "away" | "third" | "special" | "retro";

export interface Kit {
  id: string;
  name: string;
  team: string;
  league: string;
  /** Sub-group inside a league tab, e.g. "Eredivisie" under Other Leagues or "CONMEBOL" under International. */
  group?: string;
  season: string;
  type: KitType | string;
  price: number;
  sizes: string[];
  image?: string;
  /** Optional photo of the back of the shirt. */
  imageBack?: string;
  /** Optional transparent cut-out photo for the featured rail (200 × 310 canvas). */
  cutout?: string;
  cutoutBack?: string;
  description?: string;
  inStock: boolean;
  /** Shirt colours used to draw the kit on the featured rail when there is no cut-out photo. */
  color?: string;
  trim?: string;
  /** Shows the kit on the rail. A number sets its position (1 = first). */
  featured?: boolean | number;
  /** Set to false if the kit does not come in long sleeve. */
  longSleeve?: boolean;
  /** Original position in kits.json, used for "Featured" sort order. */
  order: number;
}

export const TYPE_LABEL: Record<string, string> = { home: "Home", away: "Away", third: "Third", special: "Special", retro: "Retro" };

/** Club badges and league logos (logos.json). */
export const BADGES: Record<string, string> = (logos as { badges: Record<string, string> }).badges ?? {};
export const LEAGUE_LOGOS: Record<string, string> = (logos as { leagues: Record<string, string> }).leagues ?? {};

export const PRICE_BANDS = [
  { id: "u400", label: "Under $400", test: (p: number) => p < 400 },
  { id: "400-499", label: "$400 – $499", test: (p: number) => p >= 400 && p < 500 },
  { id: "500-599", label: "$500 – $599", test: (p: number) => p >= 500 && p < 600 },
  { id: "600", label: "$600 and over", test: (p: number) => p >= 600 },
];

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const sizeRank = (s: string) => {
  const i = SIZE_ORDER.indexOf(s);
  return i < 0 ? 99 : i;
};
export const sortSizes = (sizes: string[]) => [...sizes].sort((a, b) => sizeRank(a) - sizeRank(b) || a.localeCompare(b));

/** Turns a path from kits.json ("images/kits/x.jpg") into a URL that works on any page. */
export const asset = (path?: string) =>
  !path ? undefined : /^(https?:)?\/\//.test(path) || path.startsWith("/") ? path : `${import.meta.env.BASE_URL}${path}`;

type RawKit = Omit<Kit, "order" | "inStock"> & { inStock?: boolean };

export const KITS: Kit[] = (raw as RawKit[])
  .filter((k) => k && k.id && k.name)
  .map((k, i) => ({
    ...k,
    order: i,
    price: Number(k.price) || 0,
    sizes: Array.isArray(k.sizes) ? sortSizes(k.sizes) : [],
    inStock: k.inStock !== false,
    type: String(k.type || "").toLowerCase(),
    league: k.league || "Other",
    team: k.team || "Other",
  }));

/** Leagues in the order they first appear in kits.json. */
export const LEAGUES = [...new Set(KITS.map((k) => k.league))];

export type Sleeve = "short" | "long";
export const SLEEVE_LABEL: Record<Sleeve, string> = { short: "Short sleeve", long: "Long sleeve" };
export const hasLongSleeve = (k: Kit) => k.longSleeve !== false;
export const priceFor = (k: Kit, sleeve: Sleeve) => k.price + (sleeve === "long" ? SHOP.longSleeveExtra : 0);

export const money = (n: number) => `TT$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

// ---------- Filters ----------
export interface Filters {
  q: string;
  league: string;
  group: string;
  teams: string[];
  types: string[];
  sizes: string[];
  prices: string[];
  inStock: boolean;
  sort: "featured" | "price-asc" | "price-desc" | "team" | "newest";
}

export const emptyFilters = (): Filters => ({ q: "", league: "", group: "", teams: [], types: [], sizes: [], prices: [], inStock: false, sort: "featured" });

export type FilterKey = "league" | "group" | "teams" | "types" | "sizes" | "prices" | "inStock";

/** Does a kit pass every filter? `skip` ignores one group, so each group can show how many kits it would add. */
export function matches(k: Kit, f: Filters, skip?: FilterKey) {
  const q = f.q.trim().toLowerCase();
  if (q && ![k.name, k.team, k.league, k.season, k.type, k.description].join(" ").toLowerCase().includes(q)) return false;
  if (skip !== "league" && f.league && k.league !== f.league) return false;
  if (skip !== "league" && skip !== "group" && f.group && k.group !== f.group) return false;
  if (skip !== "teams" && f.teams.length && !f.teams.includes(k.team)) return false;
  if (skip !== "types" && f.types.length && !f.types.includes(k.type)) return false;
  if (skip !== "sizes" && f.sizes.length && !k.sizes.some((s) => f.sizes.includes(s))) return false;
  if (skip !== "prices" && f.prices.length && !PRICE_BANDS.some((b) => f.prices.includes(b.id) && b.test(k.price))) return false;
  if (skip !== "inStock" && f.inStock && !k.inStock) return false;
  return true;
}

export function countBy(kits: Kit[], f: Filters, skip: FilterKey, key: (k: Kit) => string | string[]) {
  const counts = new Map<string, number>();
  for (const k of kits) {
    if (!matches(k, f, skip)) continue;
    for (const v of ([] as string[]).concat(key(k))) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return counts;
}

export const seasonYear = (s: string) => parseInt(String(s).slice(0, 4), 10) || 0;
const SORTS: Record<Filters["sort"], (a: Kit, b: Kit) => number> = {
  featured: (a, b) => Number(b.inStock) - Number(a.inStock) || a.order - b.order,
  "price-asc": (a, b) => a.price - b.price || a.order - b.order,
  "price-desc": (a, b) => b.price - a.price || a.order - b.order,
  team: (a, b) => a.team.localeCompare(b.team) || a.order - b.order,
  newest: (a, b) => seasonYear(b.season) - seasonYear(a.season) || a.order - b.order,
};

export const results = (kits: Kit[], f: Filters) => kits.filter((k) => matches(k, f)).sort(SORTS[f.sort] ?? SORTS.featured);

// ---------- URL (shareable filtered views) ----------
export function filtersFromUrl(search: string): Filters {
  const p = new URLSearchParams(search);
  const list = (k: string) => (p.get(k) || "").split(",").filter(Boolean);
  const sort = p.get("sort") as Filters["sort"] | null;
  return {
    q: p.get("q") || "",
    league: p.get("league") || "",
    group: p.get("group") || "",
    teams: list("team"),
    types: list("type"),
    sizes: list("size"),
    prices: list("price"),
    inStock: p.get("instock") === "1",
    sort: sort && sort in SORTS ? sort : "featured",
  };
}

export function filtersToUrl(f: Filters, kitId?: string | null) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.league) p.set("league", f.league);
  if (f.group) p.set("group", f.group);
  if (f.teams.length) p.set("team", f.teams.join(","));
  if (f.types.length) p.set("type", f.types.join(","));
  if (f.sizes.length) p.set("size", f.sizes.join(","));
  if (f.prices.length) p.set("price", f.prices.join(","));
  if (f.inStock) p.set("instock", "1");
  if (f.sort !== "featured") p.set("sort", f.sort);
  if (kitId) p.set("kit", kitId);
  const s = p.toString();
  return s ? `?${s}` : window.location.pathname;
}

// ---------- WhatsApp ----------
const waNumber = SHOP.whatsapp.replace(/\D/g, "");
export const waLink = (text: string) => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;

export function kitEnquiry(k: Kit, size?: string, sleeve: Sleeve = "short") {
  const link = `${window.location.origin}${window.location.pathname}?kit=${encodeURIComponent(k.id)}`;
  const sizeLine = size ? `Size: ${size}` : "Size: not sure yet";
  const sleeveLine = hasLongSleeve(k) ? `\nSleeves: ${SLEEVE_LABEL[sleeve]}` : "";
  const title = k.name.includes(k.season) ? k.name : `${k.name} (${k.season})`;
  return k.inStock
    ? `Hi ${SHOP.name}! I'm interested in the ${title}.\n${sizeLine}${sleeveLine}\nPrice: ${money(priceFor(k, sleeve))}\nIs it available?\n${link}`
    : `Hi ${SHOP.name}! The ${title} shows as sold out. Will you be restocking it?\n${sizeLine}${sleeveLine}\n${link}`;
}

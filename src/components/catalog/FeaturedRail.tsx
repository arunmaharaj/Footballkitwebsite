import { useMemo } from "react";
import { ClothingRailHero, type RailGarment } from "@/components/ui/product-rail-gallery";
import { asset, money, type Kit } from "@/lib/kits";
import { KitEnquiry } from "./KitDialog";

/** Featured kits hung on the interactive rail. Uses cut-out photos when kits.json has them, otherwise draws the shirt in team colours. */
export function FeaturedRail({ kits, onBrowse }: { kits: Kit[]; onBrowse: () => void }) {
  const featured = useMemo(
    () => kits.filter((k) => k.featured).sort((a, b) => (Number(a.featured) || 99) - (Number(b.featured) || 99)).slice(0, 8),
    [kits],
  );
  const items: RailGarment[] = useMemo(
    () =>
      featured.map((k) => ({
        id: k.id,
        name: k.name,
        description: k.description || `${k.team} · ${k.group ?? k.league} · ${money(k.price)}`,
        kind: "tee",
        color: k.color ?? "#9ca3af",
        trim: k.trim,
        image: asset(k.cutout),
        backImage: asset(k.cutoutBack),
        tag: money(k.price),
        details: [k.team, k.group ?? k.league, k.season, k.inStock ? "In stock" : "Sold out"],
      })),
    [featured],
  );
  if (items.length === 0) return null;
  return (
    <ClothingRailHero
      items={items}
      hanger="wood"
      eyebrow="Featured kits"
      heading="Fresh on the rail this week"
      caption="Slide the hangers, tap a shirt to take a closer look."
      autoplay
      detailAction={(_, i) => <KitEnquiry key={featured[i]!.id} kit={featured[i]!} align="center" />}
      action={
        <button type="button" onClick={onBrowse} className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm transition hover:-translate-y-px hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          Browse all kits by league
        </button>
      }
      className="border-b border-border"
    />
  );
}

import { useMemo, useState } from "react";
import { ClothingRailHero, type RailGarment } from "@/components/ui/product-rail-gallery";
import { asset, kitEnquiry, money, waLink, type Kit } from "@/lib/kits";
import { SizePicker } from "./KitDialog";
import { WhatsAppButton } from "./WhatsAppButton";

function RailEnquiry({ kit }: { kit: Kit }) {
  const [size, setSize] = useState("");
  return (
    <div className="mt-2 flex flex-col items-center gap-3 md:items-start">
      <SizePicker sizes={kit.sizes} value={size} onChange={setSize} />
      <WhatsAppButton size="lg" href={waLink(kitEnquiry(kit, size))}>
        {kit.inStock ? (size ? `Enquire about size ${size}` : "Enquire on WhatsApp") : "Ask about restock"}
      </WhatsAppButton>
    </div>
  );
}

/** Featured kits hung on the interactive rail. Uses cut-out photos when kits.json has them, otherwise draws the shirt in team colours. */
export function FeaturedRail({ kits, onBrowse }: { kits: Kit[]; onBrowse: () => void }) {
  const featured = useMemo(() => kits.filter((k) => k.featured).slice(0, 8), [kits]);
  const items: RailGarment[] = useMemo(
    () =>
      featured.map((k) => ({
        id: k.id,
        name: k.name,
        description: k.description,
        kind: "tee",
        color: k.color,
        trim: k.trim,
        image: asset(k.cutout),
        backImage: asset(k.cutoutBack),
        tag: money(k.price),
        details: [k.team, k.season, k.inStock ? "In stock" : "Sold out"],
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
      detailAction={(_, i) => <RailEnquiry kit={featured[i]!} />}
      action={
        <button type="button" onClick={onBrowse} className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm transition hover:-translate-y-px hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          Browse all kits by league
        </button>
      }
      className="border-b border-border"
    />
  );
}

import { asset, BADGES, money, TYPE_LABEL, type Kit } from "@/lib/kits";
import { cn } from "@/lib/utils";

const fallback = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = asset("images/placeholder.svg")!;
};

export function KitCard({ kit, onOpen }: { kit: Kit; onOpen: (id: string) => void }) {
  const badge = BADGES[kit.team];
  return (
    <button
      type="button"
      onClick={() => onOpen(kit.id)}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgb(17_24_39/0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="relative block aspect-square overflow-hidden bg-[#f3f3f3]">
        <img
          src={asset(kit.image) ?? asset("images/placeholder.svg")}
          alt=""
          loading="lazy"
          onError={fallback}
          className={cn("absolute inset-0 size-full object-contain p-2 mix-blend-multiply transition-opacity duration-300", kit.imageBack && "group-hover:opacity-0", !kit.inStock && "opacity-45")}
        />
        {kit.imageBack && (
          <img src={asset(kit.imageBack)} alt="" loading="lazy" className="absolute inset-0 size-full object-contain p-2 opacity-0 mix-blend-multiply transition-opacity duration-300 group-hover:opacity-100" />
        )}
        {kit.type && (
          <span className={cn("absolute left-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide shadow-sm", kit.type === "retro" ? "bg-foreground text-background" : kit.type === "special" ? "bg-accent text-accent-foreground" : "bg-card")}>
            {TYPE_LABEL[kit.type] ?? kit.type}
          </span>
        )}
        {!kit.inStock && <span className="absolute bottom-2.5 left-2.5 rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold text-accent">Sold out</span>}
      </span>
      <span className="flex flex-1 flex-col gap-0.5 p-3 sm:p-3.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {badge && <img src={asset(badge)} alt="" loading="lazy" className="size-4 object-contain" />}
          {kit.team}
        </span>
        <span className="text-sm font-semibold leading-snug sm:text-[15px]">{kit.name}</span>
        <span className="text-xs text-muted-foreground">{kit.season}</span>
        <span className="mt-auto flex flex-wrap items-center justify-between gap-x-2 pt-2.5">
          <span className="font-bold">{money(kit.price)}</span>
          <span className="text-xs text-muted-foreground">{kit.sizes.join(" ")}</span>
        </span>
      </span>
    </button>
  );
}

import { asset, money, TYPE_LABEL, type Kit } from "@/lib/kits";
import { cn } from "@/lib/utils";

export function KitCard({ kit, onOpen }: { kit: Kit; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(kit.id)}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgb(17_24_39/0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="relative block aspect-square bg-secondary p-4 sm:p-6">
        <img
          src={asset(kit.image) ?? asset("images/placeholder.svg")}
          alt=""
          loading="lazy"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = asset("images/placeholder.svg")!; }}
          className={cn("size-full object-contain transition-transform group-hover:scale-[1.03]", !kit.inStock && "opacity-45")}
        />
        {kit.type && (
          <span className={cn("absolute left-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide shadow-sm", kit.type === "retro" ? "bg-foreground text-background" : "bg-card")}>
            {TYPE_LABEL[kit.type] ?? kit.type}
          </span>
        )}
        {!kit.inStock && <span className="absolute bottom-2.5 left-2.5 rounded-full bg-card px-2.5 py-0.5 text-xs font-semibold text-accent">Sold out</span>}
      </span>
      <span className="flex flex-1 flex-col gap-0.5 p-3 sm:p-3.5">
        <span className="text-xs text-muted-foreground">{kit.team}</span>
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

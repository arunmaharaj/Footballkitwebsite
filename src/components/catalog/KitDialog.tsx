import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { asset, kitEnquiry, money, TYPE_LABEL, waLink, type Kit } from "@/lib/kits";
import { cn } from "@/lib/utils";
import { WhatsAppButton } from "./WhatsAppButton";

export function SizePicker({ sizes, value, onChange }: { sizes: string[]; value: string; onChange: (s: string) => void }) {
  if (!sizes.length) return <p className="text-sm text-muted-foreground">Ask us about sizes</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={value === s}
          onClick={() => onChange(value === s ? "" : s)}
          className={cn(
            "h-11 min-w-12 rounded-lg border px-3 text-sm font-medium transition-colors",
            value === s ? "border-foreground bg-foreground text-background" : "border-input bg-card hover:border-foreground",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

export function KitDialog({ kit, onClose }: { kit: Kit | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [size, setSize] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (kit) {
      setSize(kit.sizes.length === 1 ? kit.sizes[0]! : "");
      if (!d.open) d.showModal();
    } else if (d.open) d.close();
  }, [kit]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
      aria-labelledby="kit-title"
      className="m-auto max-h-[calc(100dvh-24px)] w-[min(920px,calc(100vw-24px))] overflow-y-auto rounded-2xl bg-card p-0 text-foreground shadow-2xl"
    >
      {kit && (
        <div className="grid sm:grid-cols-2">
          <form method="dialog" className="sticky top-0 z-10 col-span-full flex h-0 justify-end">
            <button className="m-3 grid size-9 place-items-center rounded-full bg-secondary hover:bg-border" aria-label="Close">
              <X className="size-5" />
            </button>
          </form>
          <div className="grid place-items-center bg-secondary px-16 py-6 sm:p-10">
            <img src={asset(kit.image)} alt={kit.name} className="max-h-60 w-full object-contain sm:max-h-[420px]" />
          </div>
          <div className="flex flex-col gap-2 p-5 sm:p-7">
            <p className="pr-10 text-sm text-muted-foreground">{kit.team} · {kit.league}</p>
            <h2 id="kit-title" tabIndex={-1} autoFocus className="text-2xl font-bold leading-tight tracking-tight outline-none">{kit.name}</h2>
            <p className="my-1 flex items-center gap-3 text-2xl font-bold">
              {money(kit.price)}
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", kit.inStock ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-accent")}>
                {kit.inStock ? "In stock" : "Sold out"}
              </span>
            </p>
            {kit.description && <p className="mb-2 text-[15px] leading-relaxed">{kit.description}</p>}
            <p className="text-sm font-semibold">Size</p>
            <div className="mb-3"><SizePicker sizes={kit.sizes} value={size} onChange={setSize} /></div>
            <WhatsAppButton size="lg" href={waLink(kitEnquiry(kit, size))}>
              {kit.inStock ? (size ? `Enquire about size ${size}` : "Enquire on WhatsApp") : "Ask about restock"}
            </WhatsAppButton>
            <p className="text-sm text-muted-foreground">
              {kit.inStock ? (size ? "Opens WhatsApp with your message ready to send." : "Pick a size, or just ask us.") : "Sold out right now. Message us and we'll tell you when it's back."}
            </p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-border pt-3 text-sm">
              {[["Team", kit.team], ["League", kit.league], ["Season", kit.season], ["Kit", TYPE_LABEL[kit.type] ?? kit.type]].map(([a, b]) => (
                <div key={a} className="contents"><dt className="text-muted-foreground">{a}</dt><dd>{b}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </dialog>
  );
}

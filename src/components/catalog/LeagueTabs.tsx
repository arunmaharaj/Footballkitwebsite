import { cn } from "@/lib/utils";

export function LeagueTabs({ leagues, active, total, onSelect }: {
  leagues: { name: string; count: number }[];
  active: string;
  total: number;
  onSelect: (league: string) => void;
}) {
  const tabs = [{ name: "", label: "All kits", count: total }, ...leagues.map((l) => ({ ...l, label: l.name }))];
  return (
    <nav aria-label="Leagues" className="border-t border-border">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button
            key={t.name || "all"}
            type="button"
            aria-current={active === t.name}
            onClick={(e) => { onSelect(t.name); e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" }); }}
            className={cn(
              "flex h-12 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-medium transition-colors",
              active === t.name ? "border-accent font-semibold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span className="rounded-full bg-secondary px-1.5 py-px text-xs text-muted-foreground">{t.count}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

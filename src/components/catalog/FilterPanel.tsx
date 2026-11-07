import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { asset, BADGES, countBy, LEAGUE_LOGOS, PRICE_BANDS, sortSizes, TYPE_LABEL, type Filters, type Kit } from "@/lib/kits";
import { cn } from "@/lib/utils";

type ListKey = "teams" | "types" | "sizes" | "prices";

function Check({ label, count, checked, onChange, icon }: { label: string; count: number; checked: boolean; onChange: () => void; icon?: string }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 text-sm hover:bg-secondary", !count && !checked && "opacity-45")}>
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 shrink-0 accent-foreground" />
      {icon && <img src={asset(icon)} alt="" loading="lazy" className="size-5 shrink-0 object-contain" />}
      <span className="flex-1">{label}</span>
      <span className="text-xs text-muted-foreground">{count}</span>
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border py-4 last:border-b-0">
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function FilterPanel({ kits, filters, resultCount, open, onToggle, onInStock, onClear, onClose }: {
  kits: Kit[];
  filters: Filters;
  resultCount: number;
  open: boolean;
  onToggle: (key: ListKey, value: string) => void;
  onInStock: (v: boolean) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [teamQ, setTeamQ] = useState("");

  const teamGroups = useMemo(() => {
    const counts = countBy(kits, filters, "teams", (k) => k.team);
    const pool = kits.filter((k) => (!filters.league || k.league === filters.league) && (!filters.group || k.group === filters.group));
    const q = teamQ.trim().toLowerCase();
    const byLeague = new Map<string, string[]>();
    [...new Set(pool.map((k) => k.team))].sort().forEach((team) => {
      if (q && !team.toLowerCase().includes(q) && !filters.teams.includes(team)) return;
      const kit = pool.find((k) => k.team === team)!;
      const league = kit.group ?? kit.league;
      byLeague.set(league, [...(byLeague.get(league) ?? []), team]);
    });
    const order = [...new Set(pool.map((k) => k.group ?? k.league))];
    return { counts, groups: [...byLeague.entries()].sort(([a], [b]) => order.indexOf(a) - order.indexOf(b)) };
  }, [kits, filters, teamQ]);

  const typeCounts = countBy(kits, filters, "types", (k) => k.type);
  const sizeCounts = countBy(kits, filters, "sizes", (k) => k.sizes);
  const priceCounts = countBy(kits, filters, "prices", (k) => PRICE_BANDS.filter((b) => b.test(k.price)).map((b) => b.id));
  const allSizes = sortSizes([...new Set(kits.flatMap((k) => k.sizes))]);
  const grouped = teamGroups.groups.length > 1;

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/45 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        aria-label="Filters"
        className={cn(
          "flex flex-col",
          "max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:z-50 max-lg:w-[min(360px,88vw)] max-lg:bg-card max-lg:p-4 max-lg:shadow-2xl max-lg:transition-transform",
          open ? "max-lg:translate-x-0" : "max-lg:invisible max-lg:translate-x-full",
          "lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)]",
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Filters</h2>
          <button type="button" onClick={onClose} aria-label="Close filters" className="grid size-9 place-items-center rounded-full bg-secondary lg:hidden">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
          <Group title="Team">
            <input
              type="search"
              value={teamQ}
              onChange={(e) => setTeamQ(e.target.value)}
              placeholder="Find a team"
              className="mb-2 h-9 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus:border-foreground sm:text-sm"
            />
            <div className="lg:max-h-72 lg:overflow-y-auto">
              {teamGroups.groups.length === 0 && <p className="text-sm text-muted-foreground">No teams found</p>}
              {teamGroups.groups.map(([league, teams]) => (
                <div key={league}>
                  {grouped && (
                    <p className="mb-0.5 mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      {LEAGUE_LOGOS[league] && <img src={asset(LEAGUE_LOGOS[league])} alt="" className="size-4 object-contain" />}
                      {league}
                    </p>
                  )}
                  {teams.map((t) => (
                    <Check key={t} label={t} icon={BADGES[t]} count={teamGroups.counts.get(t) ?? 0} checked={filters.teams.includes(t)} onChange={() => onToggle("teams", t)} />
                  ))}
                </div>
              ))}
            </div>
          </Group>
          <Group title="Kit type">
            {Object.entries(TYPE_LABEL).filter(([v]) => kits.some((k) => k.type === v)).map(([v, label]) => (
              <Check key={v} label={label} count={typeCounts.get(v) ?? 0} checked={filters.types.includes(v)} onChange={() => onToggle("types", v)} />
            ))}
          </Group>
          <Group title="Size">
            <div className="flex flex-wrap gap-1.5">
              {allSizes.map((s) => {
                const on = filters.sizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    disabled={!on && !sizeCounts.get(s)}
                    onClick={() => onToggle("sizes", s)}
                    className={cn("h-9 min-w-11 rounded-lg border px-2.5 text-sm font-medium disabled:opacity-40", on ? "border-foreground bg-foreground text-background" : "border-input bg-card hover:border-foreground")}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </Group>
          <Group title="Price (TTD)">
            {PRICE_BANDS.filter((b) => kits.some((k) => b.test(k.price))).map((b) => (
              <Check key={b.id} label={b.label} count={priceCounts.get(b.id) ?? 0} checked={filters.prices.includes(b.id)} onChange={() => onToggle("prices", b.id)} />
            ))}
          </Group>
          <Group title="Availability">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
              <input type="checkbox" checked={filters.inStock} onChange={(e) => onInStock(e.target.checked)} className="size-[18px] accent-foreground" />
              In stock only
            </label>
          </Group>
        </div>
        <div className="flex gap-2 border-t border-border pt-3 lg:hidden">
          <button type="button" onClick={onClear} className="h-11 flex-1 rounded-full border border-input font-semibold">Clear all</button>
          <button type="button" onClick={onClose} className="h-11 flex-1 rounded-full bg-foreground font-semibold text-background">Show {resultCount} kits</button>
        </div>
      </aside>
    </>
  );
}

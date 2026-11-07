import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { SHOP } from "@/config";
import {
  asset, countBy, emptyFilters, filtersFromUrl, filtersToUrl, KITS, LEAGUE_LOGOS, LEAGUES, PRICE_BANDS, results, TYPE_LABEL, type Filters,
} from "@/lib/kits";
import { cn } from "@/lib/utils";

const PAGE = 48;
import { Header } from "@/components/catalog/Header";
import { LeagueTabs } from "@/components/catalog/LeagueTabs";
import { FeaturedRail } from "@/components/catalog/FeaturedRail";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import { KitCard } from "@/components/catalog/KitCard";
import { KitDialog } from "@/components/catalog/KitDialog";

type ListKey = "teams" | "types" | "sizes" | "prices";

export default function App() {
  const [filters, setFilters] = useState<Filters>(() => filtersFromUrl(window.location.search));
  const [kitId, setKitId] = useState<string | null>(() => new URLSearchParams(window.location.search).get("kit"));
  const [drawer, setDrawer] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const catalogRef = useRef<HTMLDivElement>(null);

  useEffect(() => { history.replaceState(null, "", filtersToUrl(filters, kitId)); }, [filters, kitId]);
  useEffect(() => { document.title = `${SHOP.name} | Football Kits in Trinidad & Tobago`; }, []);
  useEffect(() => { document.body.style.overflow = drawer ? "hidden" : ""; }, [drawer]);

  const list = useMemo(() => results(KITS, filters), [filters]);
  const leagues = useMemo(() => {
    const counts = countBy(KITS, { ...filters, teams: [] }, "league", (k) => k.league);
    return LEAGUES.map((name) => ({ name, count: counts.get(name) ?? 0 }));
  }, [filters]);
  const leagueTotal = useMemo(() => results(KITS, { ...filters, league: "", group: "", teams: [] }).length, [filters]);
  const groups = useMemo(() => {
    if (!filters.league) return [];
    const counts = countBy(KITS, { ...filters, teams: [] }, "group", (k) => k.group ?? "");
    return [...new Set(KITS.filter((k) => k.league === filters.league && k.group).map((k) => k.group!))].map((name) => ({ name, count: counts.get(name) ?? 0 }));
  }, [filters]);
  useEffect(() => { setShown(PAGE); }, [filters]);

  const update = useCallback((patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch })), []);
  const toggle = (key: ListKey, value: string) =>
    setFilters((f) => ({ ...f, [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value] }));
  const setLeague = (league: string) =>
    setFilters((f) => ({ ...f, league, group: "", teams: league ? f.teams.filter((t) => KITS.some((k) => k.team === t && k.league === league)) : f.teams }));
  const setGroup = (group: string) =>
    setFilters((f) => ({ ...f, group, teams: group ? f.teams.filter((t) => KITS.some((k) => k.team === t && k.group === group)) : f.teams }));
  const clearAll = () => setFilters((f) => ({ ...emptyFilters(), sort: f.sort }));
  const scrollToCatalog = () => catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const pills: { label: string; remove: () => void }[] = [
    ...(filters.q ? [{ label: `“${filters.q}”`, remove: () => update({ q: "" }) }] : []),
    ...(filters.league ? [{ label: filters.league, remove: () => update({ league: "", group: "" }) }] : []),
    ...(filters.group ? [{ label: filters.group, remove: () => update({ group: "" }) }] : []),
    ...filters.teams.map((t) => ({ label: t, remove: () => toggle("teams", t) })),
    ...filters.types.map((t) => ({ label: TYPE_LABEL[t] ?? t, remove: () => toggle("types", t) })),
    ...filters.sizes.map((s) => ({ label: `Size ${s}`, remove: () => toggle("sizes", s) })),
    ...filters.prices.map((p) => ({ label: PRICE_BANDS.find((b) => b.id === p)?.label ?? p, remove: () => toggle("prices", p) })),
    ...(filters.inStock ? [{ label: "In stock", remove: () => update({ inStock: false }) }] : []),
  ];
  const sideFilterCount = filters.teams.length + filters.types.length + filters.sizes.length + filters.prices.length + Number(filters.inStock);
  const heading = filters.teams.length === 1 ? `${filters.teams[0]} kits` : filters.group ? `${filters.group} kits` : filters.league ? `${filters.league} kits` : filters.q ? `Results for “${filters.q}”` : "All kits";
  const openKit = KITS.find((k) => k.id === kitId) ?? null;
  const browsing = pills.length > 0;

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <Header q={filters.q} onSearch={(q) => { update({ q }); if (q) scrollToCatalog(); }} />
        <LeagueTabs leagues={leagues} active={filters.league} total={leagueTotal} onSelect={(l) => { setLeague(l); scrollToCatalog(); }} />
      </header>

      {!browsing && <FeaturedRail kits={KITS} onBrowse={scrollToCatalog} />}

      <div ref={catalogRef} className="mx-auto grid max-w-7xl scroll-mt-32 gap-7 px-4 pb-12 pt-5 lg:grid-cols-[250px_1fr] lg:items-start">
        <FilterPanel
          kits={KITS}
          filters={filters}
          resultCount={list.length}
          open={drawer}
          onToggle={toggle}
          onInStock={(inStock) => update({ inStock })}
          onClear={clearAll}
          onClose={() => setDrawer(false)}
        />

        <main className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <button type="button" onClick={clearAll} className="underline underline-offset-2 hover:text-foreground">All kits</button>
            {filters.league && (<><span className="text-input">/</span><button type="button" onClick={() => update({ teams: [], group: "" })} className="underline underline-offset-2 hover:text-foreground">{filters.league}</button></>)}
            {filters.group && (<><span className="text-input">/</span><button type="button" onClick={() => update({ teams: [] })} className="underline underline-offset-2 hover:text-foreground">{filters.group}</button></>)}
            {filters.teams.length === 1 && (<><span className="text-input">/</span><span>{filters.teams[0]}</span></>)}
          </nav>
          <div className="mb-2.5 mt-1.5 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{heading}</h1>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDrawer(true)} className="inline-flex h-10 items-center gap-2 rounded-full border border-input bg-card px-4 text-sm font-semibold lg:hidden">
                <SlidersHorizontal className="size-4" /> Filters
                {sideFilterCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-xs text-accent-foreground">{sideFilterCount}</span>}
              </button>
              <label>
                <span className="sr-only">Sort by</span>
                <select
                  value={filters.sort}
                  onChange={(e) => update({ sort: e.target.value as Filters["sort"] })}
                  className="h-10 cursor-pointer rounded-full border border-input bg-card px-4 text-sm"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="team">Team A–Z</option>
                  <option value="newest">Newest season</option>
                </select>
              </label>
            </div>
          </div>

          {groups.length > 1 && (
            <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label={`${filters.league} groups`}>
              {[{ name: "", count: groups.reduce((n, g) => n + g.count, 0) }, ...groups].map((g) => {
                const logo = g.name ? LEAGUE_LOGOS[g.name] : undefined;
                const on = filters.group === g.name;
                return (
                  <button
                    key={g.name || "all"}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setGroup(g.name)}
                    className={cn("flex h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium", on ? "border-foreground bg-foreground text-background" : "border-input bg-card hover:border-foreground")}
                  >
                    {logo && <img src={asset(logo)} alt="" className={cn("size-5 object-contain", on && "rounded-sm bg-white p-px")} />}
                    {g.name || `All ${filters.league}`}
                    <span className={cn("text-xs", on ? "text-background/70" : "text-muted-foreground")}>{g.count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {pills.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-live="polite">
              {pills.map((p) => (
                <button key={p.label} type="button" onClick={p.remove} aria-label={`Remove filter ${p.label}`} className="inline-flex h-8 items-center gap-1 rounded-full bg-red-50 pl-3 pr-2 text-xs font-semibold text-accent hover:bg-red-100">
                  {p.label} <X className="size-3.5" aria-hidden="true" />
                </button>
              ))}
              {pills.length > 1 && <button type="button" onClick={clearAll} className="px-2 text-xs text-muted-foreground underline">Clear all</button>}
            </div>
          )}
          <p className="my-3 text-sm text-muted-foreground">{list.length} {list.length === 1 ? "kit" : "kits"}</p>

          {list.length ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] sm:gap-4">
              {list.slice(0, shown).map((k) => <KitCard key={k.id} kit={k} onOpen={setKitId} />)}
            </div>
          ) : null}
          {list.length > shown && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground">Showing {shown} of {list.length}</p>
              <button type="button" onClick={() => setShown((n) => n + PAGE)} className="h-11 rounded-full border border-input bg-card px-6 text-sm font-semibold hover:border-foreground">
                Show more kits
              </button>
            </div>
          )}
          {list.length ? null : (
            <div className="py-12 text-center text-muted-foreground">
              <p>No kits match those filters.</p>
              <button type="button" onClick={clearAll} className="mt-3 h-10 rounded-full border border-input bg-card px-4 text-sm font-semibold text-foreground">Clear all filters</button>
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-border bg-card py-6">
        <div className="mx-auto max-w-7xl px-4 text-sm">
          <p><strong>{SHOP.name}</strong> · {SHOP.location}</p>
          <p className="mt-1 text-muted-foreground">Browse only, no online payments. Prices in TTD. Message us on WhatsApp to check availability, sizing and collection or delivery.</p>
          {SHOP.instagram && <a href={SHOP.instagram} target="_blank" rel="noopener" className="mt-1 inline-block underline">Instagram</a>}
        </div>
      </footer>

      <KitDialog kit={openKit} onClose={() => setKitId(null)} />
    </div>
  );
}

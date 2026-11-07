import { Search, Shirt } from "lucide-react";
import { SHOP } from "@/config";
import { waLink } from "@/lib/kits";
import { WhatsAppButton } from "./WhatsAppButton";

export function Header({ q, onSearch }: { q: string; onSearch: (q: string) => void }) {
  return (
    <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-2.5 sm:h-16 sm:flex-nowrap sm:py-0">
      <a href="./" className="flex flex-1 items-center gap-2.5 whitespace-nowrap text-lg font-bold sm:flex-none">
        <span className="grid size-8 place-items-center rounded-lg bg-foreground text-background">
          <Shirt className="size-[18px]" aria-hidden="true" />
        </span>
        {SHOP.name}
      </a>
      <label className="relative order-3 w-full sm:order-none sm:ml-auto sm:max-w-md">
        <span className="sr-only">Search kits</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search teams, kits, seasons"
          className="h-10 w-full rounded-full border border-input bg-secondary pl-10 pr-4 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground focus:bg-card sm:text-sm"
        />
      </label>
      <WhatsAppButton href={waLink(`Hi ${SHOP.name}! I'm browsing your kits and have a question.`)} aria-label="Message us on WhatsApp" className="max-sm:w-10 max-sm:px-0">
        <span className="max-sm:hidden">WhatsApp us</span>
      </WhatsAppButton>
    </div>
  );
}

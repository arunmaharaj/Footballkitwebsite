import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"a"> & { size?: "sm" | "lg"; iconOnly?: boolean };

export function WhatsAppButton({ size = "sm", iconOnly, className, children, ...rest }: Props) {
  return (
    <a
      target="_blank"
      rel="noopener"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp font-semibold text-white transition-colors hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        size === "lg" ? "h-12 px-6 text-base" : "h-10 px-4 text-sm",
        iconOnly && "w-10 px-0",
        className,
      )}
      {...rest}
    >
      <MessageCircle className="size-[18px] shrink-0" aria-hidden="true" />
      {!iconOnly && children}
    </a>
  );
}

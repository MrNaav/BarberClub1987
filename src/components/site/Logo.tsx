import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <a
      href="#inicio"
      aria-label="Barber Club 1987 — voltar ao início"
      className={cn("group inline-flex items-baseline gap-2 leading-none", className)}
    >
      <span className="font-display text-xl font-semibold uppercase tracking-[0.14em] text-ivory sm:text-[1.375rem]">
        Barber Club
      </span>
      <span className="font-sans text-[0.625rem] font-semibold tracking-[0.3em] text-bronze transition-colors duration-300 group-hover:text-bronze-light">
        1987
      </span>
    </a>
  );
}

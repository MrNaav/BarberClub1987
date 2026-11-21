import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Logo } from "./Logo";
import { BOOKING_HREF, NAV_LINKS } from "./nav";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-500",
          solid
            ? "border-hairline bg-ink/95 backdrop-blur-md"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="container-editorial flex h-[4.5rem] items-center justify-between gap-6 lg:h-20">
          <Logo />

          <nav aria-label="Navegação principal" className="hidden items-center gap-10 lg:flex">
            <ul className="flex items-center gap-9">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="link-line text-[0.75rem] font-medium uppercase tracking-[0.2em] text-ivory/75 transition-colors duration-300 hover:text-ivory"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <Button asChild variant="line-bronze" size="compact">
              <a href={BOOKING_HREF}>Agendar horário</a>
            </Button>
          </nav>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="-mr-2 flex h-11 w-11 items-center justify-center lg:hidden"
          >
            <span className="relative block h-3 w-6">
              <span
                className={cn(
                  "absolute left-0 top-0 h-px w-6 bg-ivory transition-transform duration-300",
                  open && "translate-y-[5.5px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute bottom-0 left-0 h-px bg-ivory transition-[transform,width] duration-300",
                  open ? "w-6 -translate-y-[5.5px] -rotate-45" : "w-4",
                )}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Sibling of the header: its backdrop blur would otherwise trap this fixed panel. */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-x-0 bottom-0 top-[4.5rem] z-40 overflow-y-auto bg-ink transition-[opacity,visibility] duration-500 lg:hidden",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <nav
          aria-label="Navegação principal"
          className="container-editorial flex h-full flex-col justify-between pb-10 pt-10"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((link, index) => (
              <li key={link.href} className="border-b border-hairline">
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-5 py-5 text-ivory transition-colors hover:text-bronze-light"
                >
                  <span className="eyebrow text-bronze">0{index + 1}</span>
                  <span className="display text-[2.5rem] leading-none">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-6">
            <Button asChild variant="bronze" size="cta" className="w-full">
              <a href={BOOKING_HREF} onClick={() => setOpen(false)}>
                Agendar horário
              </a>
            </Button>
            <p className="eyebrow text-center text-stone">Est. 1987 · Barbearia tradicional</p>
          </div>
        </nav>
      </div>
    </>
  );
}

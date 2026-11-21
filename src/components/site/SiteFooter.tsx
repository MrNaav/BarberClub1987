import { useSuspenseQuery } from "@tanstack/react-query";

import { summarizeOpeningHours } from "@/lib/booking/core";
import { catalogQuery } from "@/lib/booking/queries";

import { Logo } from "./Logo";
import { NAV_LINKS } from "./nav";

export function SiteFooter() {
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  const HOURS = summarizeOpeningHours(catalog.hours);
  return (
    <footer id="contato" className="scroll-mt-[4.5rem] border-t border-hairline bg-ink">
      <div className="container-editorial grid grid-cols-2 gap-x-6 gap-y-12 py-16 lg:grid-cols-12 lg:gap-10 lg:py-20">
        <div className="col-span-2 lg:col-span-4">
          <Logo />
          <p className="mt-6 max-w-xs font-display text-xl italic leading-snug text-ivory/70">
            Estilo que atravessa gerações.
          </p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="link-line mt-8 inline-block text-[0.75rem] font-medium uppercase tracking-[0.2em] text-ivory/80 transition-colors hover:text-ivory"
          >
            Instagram · @barberclub1987
          </a>
        </div>

        <nav aria-label="Navegação do rodapé" className="lg:col-span-2 lg:col-start-5">
          <p className="eyebrow text-bronze">Navegação</p>
          <ul className="mt-6 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-stone transition-colors duration-300 hover:text-ivory"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-3">
          <p className="eyebrow text-bronze">Endereço</p>
          <address className="mt-6 text-sm not-italic leading-relaxed text-stone">
            Rua Exemplo, 1987 — Centro
            <br />
            São Paulo · SP
          </address>
          <p className="mt-3 text-[0.6875rem] uppercase tracking-[0.18em] text-stone/70">
            Endereço demonstrativo
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 lg:col-span-3">
          <p className="eyebrow text-bronze">Horário</p>
          <dl className="mt-6 flex flex-col gap-3 text-sm">
            {HOURS.map(([day, time]) => (
              <div key={day} className="flex justify-between gap-6 border-b border-hairline pb-3">
                <dt className="text-stone">{day}</dt>
                <dd className="text-ivory">{time}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[0.6875rem] uppercase tracking-[0.18em] text-stone/70">
            Horário demonstrativo
          </p>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="container-editorial flex flex-col gap-2 py-6 text-[0.6875rem] uppercase tracking-[0.18em] text-stone/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Barber Club 1987. Todos os direitos reservados.</p>
          <p>Est. 1987</p>
        </div>
      </div>
    </footer>
  );
}

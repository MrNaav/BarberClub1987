import heroImage from "@/assets/hero-barber.jpg";
import { Button } from "@/components/ui/button";

import { BOOKING_HREF } from "./nav";

export function Hero() {
  return (
    <section
      id="inicio"
      aria-label="Início"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink"
    >
      <img
        src={heroImage}
        alt="Barbeiro realizando um corte com tesoura em uma barbearia de madeira escura e couro"
        width={1536}
        height={1024}
        fetchPriority="high"
        className="animate-hero-zoom absolute inset-0 -z-20 h-full w-full object-cover object-[72%_center] lg:object-center"
      />
      {/* Overlays keep the headline legible on every screen size */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink/55 lg:bg-transparent" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 hidden bg-[image:var(--overlay-hero)] lg:block"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[image:var(--overlay-hero-bottom)]" />

      <div className="container-editorial flex flex-1 flex-col justify-end pb-28 pt-32 sm:pb-32 lg:justify-center lg:pb-20 lg:pt-36">
        <div className="max-w-[46rem]">
          <p
            className="eyebrow animate-hero-rise flex items-center gap-4 text-bronze-light"
            style={{ animationDelay: "150ms" }}
          >
            <span aria-hidden className="h-px w-10 bg-bronze" />
            Est. 1987 · Barbearia tradicional
          </p>

          <h1
            className="display animate-hero-rise mt-7 text-[3.4rem] text-ivory sm:text-[5.25rem] lg:text-[6.5rem] xl:text-[7.75rem]"
            style={{ animationDelay: "300ms" }}
          >
            <span className="block">Estilo que</span>
            <span className="block">atravessa</span>
            <span className="block">
              <em className="font-normal italic text-bronze-light">gerações</em>
              <span className="text-bronze">.</span>
            </span>
          </h1>

          <p
            className="animate-hero-rise mt-8 max-w-md text-[0.975rem] leading-relaxed text-ivory/80 sm:text-base"
            style={{ animationDelay: "500ms" }}
          >
            Mais do que um corte. Uma experiência que respeita a tradição e valoriza seu estilo.
          </p>

          <div
            className="animate-hero-rise mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4"
            style={{ animationDelay: "650ms" }}
          >
            <Button asChild variant="bronze" size="cta">
              <a href={BOOKING_HREF}>Agendar horário</a>
            </Button>
            <Button asChild variant="line" size="cta">
              <a href="#sobre">Conheça a barbearia</a>
            </Button>
          </div>
        </div>
      </div>

      <a
        href="#sobre"
        aria-label="Rolar para a próxima seção"
        className="group absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5 lg:bottom-10"
      >
        <span className="eyebrow text-[0.5625rem] text-stone transition-colors group-hover:text-ivory">
          Role
        </span>
        <span aria-hidden className="relative h-9 w-px lg:h-12 overflow-hidden bg-ivory/15">
          <span className="animate-scroll-cue absolute inset-0 bg-bronze" />
        </span>
      </a>
    </section>
  );
}

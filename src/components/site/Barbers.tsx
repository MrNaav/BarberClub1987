import { cn } from "@/lib/utils";

import { BARBERS } from "./content";
import { Reveal } from "./Reveal";

export function Barbers() {
  return (
    <section
      id="barbeiros"
      aria-labelledby="barbeiros-title"
      className="relative border-t border-hairline bg-ink-soft"
    >
      <div className="container-editorial py-24 sm:py-28 lg:py-36">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <p className="eyebrow flex items-center gap-4 text-bronze">
              <span aria-hidden className="h-px w-10 bg-bronze" />
              Barbeiros
            </p>
            <h2
              id="barbeiros-title"
              className="display mt-7 text-[2.75rem] text-ivory sm:text-6xl lg:text-[4.5rem] xl:text-[5rem]"
            >
              Mãos que
              <br />
              <em className="font-normal italic text-bronze-light">conhecem</em> o ofício.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="max-w-sm text-[0.975rem] leading-relaxed text-stone lg:text-right">
              Uma equipe formada na tradição da barbearia clássica, atenta a cada detalhe do seu
              estilo.
            </p>
          </Reveal>
        </div>

        <ul className="mt-16 grid gap-20 sm:gap-16 lg:mt-24 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-0">
          {BARBERS.map((barber, index) => (
            <Reveal
              as="li"
              key={barber.name}
              delay={index * 120}
              className={cn(index === 1 && "lg:mt-16", index === 2 && "lg:mt-32")}
            >
              <figure className="group grid gap-7 sm:grid-cols-12 sm:items-end sm:gap-8 lg:block">
                <div className="relative aspect-[4/5] overflow-hidden bg-ink sm:col-span-5 sm:aspect-[3/4]">
                  <img
                    src={barber.image}
                    alt={`Retrato de ${barber.name}, ${barber.role}`}
                    width={1024}
                    height={1536}
                    loading="lazy"
                    className="h-full w-full object-cover object-[center_15%] grayscale-[35%] transition-[transform,filter] duration-[1.2s] ease-[var(--ease-editorial)] group-hover:scale-[1.04] group-hover:grayscale-0"
                  />
                  <span className="eyebrow absolute left-5 top-5 text-ivory/70">0{index + 1}</span>
                </div>

                <figcaption className="sm:col-span-7 lg:mt-7">
                  <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-5">
                    <span className="font-display text-[1.875rem] font-medium leading-none text-ivory sm:text-[2.25rem] lg:text-[2.125rem]">
                      {barber.name}
                    </span>
                    <span className="eyebrow shrink-0 text-bronze">{barber.role}</span>
                  </div>
                  <p className="mt-5 text-[0.9375rem] leading-relaxed text-stone">{barber.bio}</p>
                  <p className="mt-6 flex items-center gap-3 text-[0.8125rem] text-ivory/85">
                    <span aria-hidden className="h-px w-6 bg-bronze" />
                    <span>
                      <span className="sr-only">Especialidade: </span>
                      {barber.specialty}
                    </span>
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

import andreImage from "@/assets/barber-andre.jpg";
import lucasImage from "@/assets/barber-lucas.jpg";
import rafaelImage from "@/assets/barber-rafael.jpg";
import { cn } from "@/lib/utils";

import { Reveal } from "./Reveal";

const BARBERS = [
  { name: "Rafael Mendes", role: "Master Barber", image: rafaelImage },
  { name: "Lucas Ferreira", role: "Barber", image: lucasImage },
  { name: "André Costa", role: "Barber", image: andreImage },
] as const;

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

        <ul className="mt-16 grid gap-12 sm:grid-cols-2 sm:gap-x-6 lg:mt-24 lg:grid-cols-3 lg:gap-x-8">
          {BARBERS.map((barber, index) => (
            <Reveal
              as="li"
              key={barber.name}
              delay={index * 120}
              className={cn(
                index === 0 && "sm:col-span-2 lg:col-span-1",
                index === 1 && "lg:mt-16",
                index === 2 && "lg:mt-32",
              )}
            >
              <figure className="group">
                <div
                  className={cn(
                    "relative overflow-hidden bg-ink",
                    index === 0 ? "aspect-[4/5] sm:aspect-[16/11] lg:aspect-[3/4]" : "aspect-[3/4]",
                  )}
                >
                  <img
                    src={barber.image}
                    alt={`Retrato de ${barber.name}, ${barber.role}`}
                    width={1024}
                    height={1536}
                    loading="lazy"
                    className="h-full w-full object-cover object-[center_20%] sm:object-[center_10%] lg:object-[center_20%] grayscale-[35%] transition-[transform,filter] duration-[1.2s] ease-[var(--ease-editorial)] group-hover:scale-[1.04] group-hover:grayscale-0"
                  />
                  <span className="absolute left-5 top-5 eyebrow text-ivory/70">0{index + 1}</span>
                </div>
                <figcaption className="mt-6 flex items-baseline justify-between gap-4 border-b border-hairline pb-5">
                  <span className="font-display text-[1.875rem] font-medium leading-none text-ivory sm:text-[2.125rem]">
                    {barber.name}
                  </span>
                  <span className="eyebrow shrink-0 text-bronze">{barber.role}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

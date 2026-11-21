import interiorImage from "@/assets/about-interior.jpg";

import { Reveal } from "./Reveal";

export function About() {
  return (
    <section
      id="sobre"
      aria-labelledby="sobre-title"
      className="relative overflow-hidden bg-ivory text-ink"
    >
      <div className="container-editorial grid gap-14 py-24 sm:py-28 lg:grid-cols-12 lg:gap-10 lg:py-36">
        <Reveal className="relative lg:col-span-5 lg:col-start-1">
          <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[5/6] lg:aspect-[4/5]">
            <img
              src={interiorImage}
              alt="Cadeira clássica de barbeiro em couro diante de espelho redondo com moldura de latão"
              width={1024}
              height={1536}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[1.4s] ease-[var(--ease-editorial)] hover:scale-[1.03]"
            />
          </div>
          <div className="absolute -bottom-6 right-0 bg-ink px-6 py-5 text-ivory sm:-right-6 sm:px-8 sm:py-6">
            <p className="eyebrow text-bronze">Desde</p>
            <p className="font-display text-5xl font-medium leading-none sm:text-6xl">1987</p>
          </div>
        </Reveal>

        <div className="relative flex flex-col justify-center lg:col-span-6 lg:col-start-7">
          <span
            aria-hidden
            className="numeral-outline pointer-events-none absolute -top-16 right-0 select-none text-[9rem] leading-none text-ink/10 sm:text-[12rem] lg:-top-24 lg:text-[15rem]"
          >
            87
          </span>

          <Reveal>
            <p className="eyebrow flex items-center gap-4 text-bronze">
              <span aria-hidden className="h-px w-10 bg-bronze" />
              Sobre a barbearia
            </p>
          </Reveal>

          <Reveal delay={100}>
            <h2
              id="sobre-title"
              className="display mt-7 text-[2.75rem] sm:text-6xl lg:text-[4.5rem] xl:text-[5rem]"
            >
              A tradição
              <br />
              está nos <em className="font-normal italic text-bronze">detalhes</em>.
            </h2>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-10 grid gap-8 sm:grid-cols-[auto_1fr] sm:gap-10">
              <span aria-hidden className="hidden h-full w-px bg-hairline-dark sm:block" />
              <p className="max-w-lg text-base leading-[1.8] text-graphite sm:text-[1.0625rem]">
                Respeitamos a essência da barbearia clássica, combinando técnica, personalidade e
                atenção aos detalhes. Cada atendimento é pensado para proporcionar uma experiência
                única, em um ambiente onde estilo e tradição se encontram.
              </p>
            </div>
          </Reveal>

          <Reveal delay={300}>
            <p className="mt-12 flex items-center gap-4 font-display text-xl italic text-ink/70 sm:text-2xl">
              <span aria-hidden className="h-px w-8 bg-bronze" />
              Barber Club, desde 1987.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

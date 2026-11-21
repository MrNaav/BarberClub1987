import { useState } from "react";

import acabamentoImage from "@/assets/service-acabamento.jpg";
import barbaImage from "@/assets/service-barba.jpg";
import corteBarbaImage from "@/assets/service-corte-barba.jpg";
import corteImage from "@/assets/service-corte.jpg";
import { cn } from "@/lib/utils";

import { Reveal } from "./Reveal";

const SERVICES = [
  {
    name: "Corte tradicional",
    description:
      "Tesoura e máquina conduzidas com precisão, respeitando o formato do rosto e o seu estilo.",
    image: corteImage,
    alt: "Barbeiro cortando cabelo com tesoura e pente",
  },
  {
    name: "Corte + barba",
    description: "O ritual completo: corte sob medida e barba desenhada, em um único atendimento.",
    image: corteBarbaImage,
    alt: "Cliente com corte degradê e barba alinhada na cadeira de couro",
  },
  {
    name: "Barba completa",
    description:
      "Toalha quente, navalha e acabamento cuidadoso para uma barba alinhada e confortável.",
    image: barbaImage,
    alt: "Barbeiro fazendo a barba com navalha e espuma",
  },
  {
    name: "Acabamento e sobrancelha",
    description:
      "Contornos, pezinho e sobrancelha ajustados para manter o visual impecável entre os cortes.",
    image: acabamentoImage,
    alt: "Máquina, navalha, pente e pincel sobre bancada de madeira",
  },
] as const;

export function Services() {
  const [active, setActive] = useState(0);

  return (
    <section id="servicos" aria-labelledby="servicos-title" className="relative bg-ink">
      <div className="container-editorial py-24 sm:py-28 lg:py-36">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow flex items-center gap-4 text-bronze">
              <span aria-hidden className="h-px w-10 bg-bronze" />
              Serviços
            </p>
            <h2
              id="servicos-title"
              className="display mt-7 text-[2.75rem] text-ivory sm:text-6xl lg:text-[4.5rem] xl:text-[5rem]"
            >
              O ofício em
              <br />
              cada <em className="font-normal italic text-bronze-light">gesto</em>.
            </h2>
          </Reveal>
          <Reveal delay={120} className="lg:col-span-4 lg:col-start-9">
            <p className="max-w-sm text-[0.975rem] leading-relaxed text-stone">
              Quatro atendimentos essenciais, executados com a calma e a precisão que cada cliente
              merece.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-12 lg:gap-10">
          <ol className="grid gap-14 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-16 lg:col-span-6 lg:flex lg:flex-col lg:gap-0">
            {SERVICES.map((service, index) => (
              <Reveal as="li" key={service.name} delay={index * 80}>
                <div
                  onMouseEnter={() => setActive(index)}
                  className="group lg:cursor-default lg:border-t lg:border-hairline lg:py-9 lg:last:border-b"
                >
                  <div className="relative mb-6 aspect-[4/5] overflow-hidden sm:aspect-[3/4] lg:hidden">
                    <img
                      src={service.image}
                      alt={service.alt}
                      width={1024}
                      height={1536}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex items-baseline gap-6 lg:gap-10">
                    <span
                      className={cn(
                        "eyebrow shrink-0 transition-colors duration-500",
                        active === index ? "text-bronze" : "text-stone lg:text-stone/60",
                      )}
                    >
                      0{index + 1}
                    </span>
                    <div>
                      <h3
                        className={cn(
                          "font-display text-3xl font-medium leading-tight transition-colors duration-500 sm:text-[2.125rem] lg:text-[2.5rem]",
                          active === index ? "text-ivory" : "text-ivory lg:text-ivory/45",
                        )}
                      >
                        {service.name}
                      </h3>
                      <p
                        className={cn(
                          "mt-3 max-w-md text-[0.9375rem] leading-relaxed text-stone transition-opacity duration-500",
                          active === index ? "lg:opacity-100" : "lg:opacity-60",
                        )}
                      >
                        {service.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>

          <div aria-hidden className="relative hidden lg:col-span-5 lg:col-start-8 lg:block">
            <div className="sticky top-28 aspect-[4/5] overflow-hidden bg-ink-soft">
              {SERVICES.map((service, index) => (
                <img
                  key={service.name}
                  src={service.image}
                  alt=""
                  width={1024}
                  height={1536}
                  loading="lazy"
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-[var(--ease-editorial)]",
                    active === index ? "scale-100 opacity-100" : "scale-[1.04] opacity-0",
                  )}
                />
              ))}
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-[image:var(--overlay-portrait)] p-7 pt-24">
                <span className="font-display text-7xl leading-none text-ivory/90">
                  0{active + 1}
                </span>
                <span className="eyebrow text-bronze-light">{SERVICES[active]?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

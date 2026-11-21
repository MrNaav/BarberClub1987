import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import { formatPrice } from "@/lib/booking/core";
import { FALLBACK_SERVICE_PHOTO, SERVICE_PHOTOS } from "@/lib/booking/images";
import { catalogQuery } from "@/lib/booking/queries";
import { cn } from "@/lib/utils";

import { Reveal } from "./Reveal";

function Price({ value, emphasis }: { value: number; emphasis?: boolean }) {
  const [currency, amount] = formatPrice(value).split(" ");
  return (
    <span
      aria-label={formatPrice(value)}
      className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap"
    >
      <span aria-hidden className="eyebrow text-stone">
        {currency}
      </span>
      <span
        aria-hidden
        className={cn(
          "font-display text-[2rem] font-medium leading-none sm:text-[2.25rem] lg:text-[2.5rem]",
          emphasis ? "text-bronze-light" : "text-ivory",
        )}
      >
        {amount}
      </span>
    </span>
  );
}

export function Services() {
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  const SERVICES = catalog.services.map((service) => {
    const photo = SERVICE_PHOTOS[service.slug] ?? FALLBACK_SERVICE_PHOTO;
    return {
      ...service,
      price: service.price_cents,
      featured: service.is_featured,
      image: photo.src,
      alt: photo.alt,
    };
  });
  const hasDemoPrices = SERVICES.some((service) => service.price_is_demo);
  const [active, setActive] = useState(0);
  const current = SERVICES[active];

  return (
    <section id="servicos" aria-labelledby="servicos-title" className="relative bg-ink">
      <div className="container-editorial py-24 sm:py-28 lg:py-36">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <p className="eyebrow flex items-center gap-4 text-bronze">
              <span aria-hidden className="h-px w-10 bg-bronze" />
              Serviços e preços
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
          <div className="lg:col-span-6">
            {SERVICES.length === 0 && (
              <p className="border-t border-hairline pt-9 text-[0.9375rem] text-stone">
                {catalog.ok
                  ? "Nenhum serviço disponível no momento."
                  : "Não foi possível carregar os serviços agora. Tente novamente em instantes."}
              </p>
            )}
            <ol className="grid gap-16 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-20 lg:flex lg:flex-col lg:gap-0">
              {SERVICES.map((service, index) => {
                const isActive = active === index;
                return (
                  <Reveal as="li" key={service.id} delay={index * 80}>
                    <div
                      onMouseEnter={() => setActive(index)}
                      className={cn(
                        "group relative lg:cursor-default lg:border-t lg:border-hairline lg:py-9 lg:pl-6",
                        index === SERVICES.length - 1 && "lg:border-b",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "absolute left-0 top-9 hidden h-[calc(100%-4.5rem)] w-px origin-top bg-bronze transition-transform duration-700 ease-[var(--ease-editorial)] lg:block",
                          isActive ? "scale-y-100" : "scale-y-0",
                        )}
                      />

                      <div className="relative mb-7 aspect-[4/5] overflow-hidden bg-ink-soft sm:aspect-[3/4] lg:hidden">
                        <img
                          src={service.image}
                          alt={service.alt}
                          width={1024}
                          height={1536}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        {service.featured && (
                          <span className="eyebrow absolute left-0 top-0 bg-ink px-4 py-3 text-bronze-light">
                            Destaque da casa
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-5 sm:gap-6 lg:gap-10">
                        <span
                          className={cn(
                            "eyebrow shrink-0 pt-3 transition-colors duration-500",
                            isActive ? "text-bronze" : "text-stone lg:text-stone/60",
                          )}
                        >
                          0{index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          {service.featured && (
                            <p className="eyebrow mb-3 hidden text-bronze lg:block">
                              Destaque da casa
                            </p>
                          )}
                          <div className="flex items-baseline justify-between gap-5 border-b border-hairline pb-4 lg:border-0 lg:pb-0">
                            <h3
                              className={cn(
                                "min-w-0 font-display text-[1.875rem] font-medium leading-[1.05] transition-colors duration-500 sm:text-[2rem] lg:text-[2.5rem]",
                                isActive ? "text-ivory" : "text-ivory lg:text-ivory/45",
                              )}
                            >
                              {service.name}
                            </h3>
                            <Price value={service.price} emphasis={service.featured} />
                          </div>
                          <p
                            className={cn(
                              "mt-4 max-w-md text-[0.9375rem] leading-relaxed text-stone transition-opacity duration-500 lg:mt-3",
                              isActive ? "lg:opacity-100" : "lg:opacity-60",
                            )}
                          >
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </ol>
            {hasDemoPrices && (
              <Reveal delay={200}>
                <p className="eyebrow mt-12 text-stone/80 lg:mt-8 lg:pl-6">
                  Valores demonstrativos
                </p>
              </Reveal>
            )}
          </div>

          <div aria-hidden className="relative hidden lg:col-span-5 lg:col-start-8 lg:block">
            <div className="sticky top-28 aspect-[4/5] overflow-hidden bg-ink-soft">
              {SERVICES.map((service, index) => (
                <img
                  key={service.id}
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
              {current?.featured && (
                <span className="eyebrow absolute left-0 top-0 bg-ink px-5 py-3.5 text-bronze-light">
                  Destaque da casa
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 bg-[image:var(--overlay-portrait)] p-7 pt-24">
                <span className="font-display text-7xl leading-none text-ivory/90">
                  0{active + 1}
                </span>
                <span className="flex flex-col items-end gap-2 text-right">
                  <span className="eyebrow text-bronze-light">{current?.name}</span>
                  {current && (
                    <span className="font-display text-3xl leading-none text-ivory">
                      {formatPrice(current.price)}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

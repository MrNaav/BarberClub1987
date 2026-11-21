import { createFileRoute } from "@tanstack/react-router";

import { BookingFlow } from "@/components/booking/BookingFlow";
import { Logo } from "@/components/site/Logo";
import { catalogQuery } from "@/lib/booking/queries";

const TITLE = "Agendar horário — Barber Club 1987";
const DESCRIPTION =
  "Escolha o serviço, o barbeiro, a data e o horário e reserve seu atendimento na Barber Club 1987.";

export const Route = createFileRoute("/agendar")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: BookingPage,
});

function BookingPage() {
  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-hairline">
        <div className="container-editorial flex h-[4.5rem] items-center justify-between gap-6">
          <Logo href="/" />
          <a
            href="/"
            className="link-line text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-ivory/80 transition-colors hover:text-ivory"
          >
            Voltar ao site
          </a>
        </div>
      </header>
      <main className="container-editorial pb-24 pt-12 sm:pt-16 lg:pb-32 lg:pt-20">
        <p className="eyebrow flex items-center gap-4 text-bronze">
          <span aria-hidden className="h-px w-10 bg-bronze" />
          Agendamento
        </p>
        <h1 className="display mt-6 text-[2.75rem] text-ivory sm:text-6xl lg:text-[4.5rem]">
          Reserve seu <em className="font-normal italic text-bronze-light">horário</em>.
        </h1>
        <div className="mt-12 lg:mt-16">
          <BookingFlow />
        </div>
      </main>
    </div>
  );
}

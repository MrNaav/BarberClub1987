import { createFileRoute } from "@tanstack/react-router";

import { About } from "@/components/site/About";
import { Barbers } from "@/components/site/Barbers";
import { Hero } from "@/components/site/Hero";
import { Services } from "@/components/site/Services";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

const TITLE = "Barber Club 1987 — Barbearia tradicional e premium";
const DESCRIPTION =
  "Barbearia que une a tradição clássica a uma estética contemporânea. Corte tradicional, barba completa e acabamento com atenção aos detalhes.";

export const Route = createFileRoute("/")({
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
  component: Index,
});

function Index() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <About />
        <Services />
        <Barbers />
      </main>
      <SiteFooter />
    </>
  );
}

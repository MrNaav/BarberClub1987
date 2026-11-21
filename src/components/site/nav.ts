export const NAV_LINKS = [
  { label: "Início", href: "#inicio" },
  { label: "Sobre", href: "#sobre" },
  { label: "Serviços", href: "#servicos" },
  { label: "Barbeiros", href: "#barbeiros" },
] as const;

/** "Agendar horário" has no booking yet in this phase: it leads to the address and hours. */
export const BOOKING_HREF = "#contato";

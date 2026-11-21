import andreImage from "@/assets/barber-andre.jpg";
import lucasImage from "@/assets/barber-lucas.jpg";
import rafaelImage from "@/assets/barber-rafael.jpg";
import acabamentoImage from "@/assets/service-acabamento.jpg";
import barbaImage from "@/assets/service-barba.jpg";
import corteBarbaImage from "@/assets/service-corte-barba.jpg";
import corteImage from "@/assets/service-corte.jpg";

/* Photos stay with the site design; names, prices and texts come from the database by slug. */

export const SERVICE_PHOTOS: Record<string, { src: string; alt: string }> = {
  "corte-tradicional": { src: corteImage, alt: "Barbeiro cortando cabelo com tesoura e pente" },
  "corte-barba": {
    src: corteBarbaImage,
    alt: "Cliente com corte degradê e barba alinhada na cadeira de couro",
  },
  "barba-completa": { src: barbaImage, alt: "Barbeiro fazendo a barba com navalha e espuma" },
  "acabamento-sobrancelha": {
    src: acabamentoImage,
    alt: "Máquina, navalha, pente e pincel sobre bancada de madeira",
  },
};

export const BARBER_PHOTOS: Record<string, string> = {
  "rafael-mendes": rafaelImage,
  "lucas-ferreira": lucasImage,
  "andre-costa": andreImage,
};

export const FALLBACK_SERVICE_PHOTO = SERVICE_PHOTOS["corte-tradicional"]!;
export const FALLBACK_BARBER_PHOTO = rafaelImage;

import andreImage from "@/assets/barber-andre.jpg";
import lucasImage from "@/assets/barber-lucas.jpg";
import rafaelImage from "@/assets/barber-rafael.jpg";
import acabamentoImage from "@/assets/service-acabamento.jpg";
import barbaImage from "@/assets/service-barba.jpg";
import corteBarbaImage from "@/assets/service-corte-barba.jpg";
import corteImage from "@/assets/service-corte.jpg";

/*
 * Conteúdo editável da landing page.
 * Preços: valores demonstrativos em reais (número inteiro). Altere apenas o campo `price`.
 * Destaque: apenas um serviço deve ter `featured: true`.
 */

export type Service = {
  name: string;
  description: string;
  price: number;
  featured?: boolean;
  image: string;
  alt: string;
};

export const SERVICES: readonly Service[] = [
  {
    name: "Corte tradicional",
    description: "Corte personalizado, executado com precisão e atenção ao estilo de cada cliente.",
    price: 75,
    image: corteImage,
    alt: "Barbeiro cortando cabelo com tesoura e pente",
  },
  {
    name: "Corte + barba",
    description:
      "Combinação de corte de cabelo e cuidado completo com a barba, garantindo harmonia e acabamento.",
    price: 120,
    featured: true,
    image: corteBarbaImage,
    alt: "Cliente com corte degradê e barba alinhada na cadeira de couro",
  },
  {
    name: "Barba completa",
    description:
      "Modelagem, alinhamento e acabamento profissional para valorizar o formato do rosto.",
    price: 65,
    image: barbaImage,
    alt: "Barbeiro fazendo a barba com navalha e espuma",
  },
  {
    name: "Acabamento e sobrancelha",
    description: "Detalhamento do corte, contornos e alinhamento das sobrancelhas.",
    price: 40,
    image: acabamentoImage,
    alt: "Máquina, navalha, pente e pincel sobre bancada de madeira",
  },
];

/** Formats a whole-real price as "R$ 75" (or "R$ 75,50" when it has cents). */
export function formatPrice(price: number): string {
  const hasCents = !Number.isInteger(price);
  return `R$ ${price.toLocaleString("pt-BR", {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export type Barber = {
  name: string;
  role: string;
  specialty: string;
  bio: string;
  image: string;
};

export const BARBERS: readonly Barber[] = [
  {
    name: "Rafael Mendes",
    role: "Master Barber",
    specialty: "Cortes clássicos",
    bio: "Especialista em cortes clássicos e técnicas tradicionais, combinando experiência, precisão e atenção aos detalhes.",
    image: rafaelImage,
  },
  {
    name: "Lucas Ferreira",
    role: "Barber",
    specialty: "Degradês e estilos urbanos",
    bio: "Focado em cortes contemporâneos, degradês e estilos urbanos, com atenção à personalidade de cada cliente.",
    image: lucasImage,
  },
  {
    name: "André Costa",
    role: "Barber",
    specialty: "Barba e acabamento",
    bio: "Especialista em barba, acabamento e cuidado masculino, valorizando simetria, precisão e estilo.",
    image: andreImage,
  },
];

import { describe, expect, it } from "vitest";

import { BARBERS, SERVICES, formatPrice } from "@/components/site/content";

describe("Serviços", () => {
  it("lista exatamente os quatro serviços definidos, nesta ordem", () => {
    expect(SERVICES.map((s) => s.name)).toEqual([
      "Corte tradicional",
      "Corte + barba",
      "Barba completa",
      "Acabamento e sobrancelha",
    ]);
  });

  it("cada serviço tem descrição e um preço positivo", () => {
    for (const service of SERVICES) {
      expect(service.description.length).toBeGreaterThan(0);
      expect(service.price).toBeGreaterThan(0);
    }
  });

  it("tem apenas um serviço em destaque", () => {
    expect(SERVICES.filter((s) => s.featured)).toHaveLength(1);
  });

  it("formata preços em reais", () => {
    expect(formatPrice(75)).toBe("R$ 75");
    expect(formatPrice(75.5)).toBe("R$ 75,50");
  });
});

describe("Barbeiros", () => {
  it("apresenta os três perfis com nomes e cargos exatos", () => {
    expect(BARBERS.map((b) => [b.name, b.role])).toEqual([
      ["Rafael Mendes", "Master Barber"],
      ["Lucas Ferreira", "Barber"],
      ["André Costa", "Barber"],
    ]);
  });
});

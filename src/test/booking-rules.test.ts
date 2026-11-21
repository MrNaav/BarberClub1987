import { describe, expect, it } from "vitest";

import {
  canTransition,
  formatDuration,
  formatPhone,
  formatPrice,
  isActiveStatus,
  isValidPhone,
  localToIso,
  parsePriceToCents,
  summarizeOpeningHours,
  toDateKey,
  formatTime,
} from "@/lib/booking/core";

describe("Preços", () => {
  it("formata centavos em reais", () => {
    expect(formatPrice(7500)).toBe("R$ 75");
    expect(formatPrice(7550)).toBe("R$ 75,50");
  });

  it("lê o preço digitado no painel", () => {
    expect(parsePriceToCents("120")).toBe(12000);
    expect(parsePriceToCents("75,50")).toBe(7550);
    expect(parsePriceToCents("R$ 1.200,00")).toBe(120000);
    expect(parsePriceToCents("abc")).toBeNull();
  });

  it("não multiplica preços decimais por cem indevidamente", () => {
    expect(parsePriceToCents("75.5")).toBe(7550);
    expect(parsePriceToCents("75.50")).toBe(7550);
    expect(parsePriceToCents("1.200")).toBe(120000);
    expect(parsePriceToCents("1.20,50")).toBeNull();
    expect(parsePriceToCents("-75")).toBeNull();
  });

  it("formata a duração", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(75)).toBe("1h15");
    expect(formatDuration(60)).toBe("1h");
  });
});

describe("Status dos agendamentos", () => {
  it("pendente pode ser confirmado ou cancelado", () => {
    expect(canTransition("pending", "confirmed")).toBe(true);
    expect(canTransition("pending", "cancelled")).toBe(true);
    expect(canTransition("pending", "completed")).toBe(false);
  });

  it("confirmado pode ser concluído, não compareceu ou cancelado", () => {
    expect(canTransition("confirmed", "completed")).toBe(true);
    expect(canTransition("confirmed", "no_show")).toBe(true);
    expect(canTransition("confirmed", "cancelled")).toBe(true);
  });

  it("concluído, cancelado e não compareceu são finais", () => {
    expect(canTransition("completed", "pending")).toBe(false);
    expect(canTransition("cancelled", "confirmed")).toBe(false);
    expect(canTransition("no_show", "completed")).toBe(false);
  });

  it("só pendente e confirmado ocupam horário", () => {
    expect(isActiveStatus("pending")).toBe(true);
    expect(isActiveStatus("confirmed")).toBe(true);
    expect(isActiveStatus("cancelled")).toBe(false);
    expect(isActiveStatus("completed")).toBe(false);
    expect(isActiveStatus("no_show")).toBe(false);
  });
});

describe("Telefone do cliente", () => {
  it("exige DDD + número", () => {
    expect(isValidPhone("(11) 91234-5678")).toBe(true);
    expect(isValidPhone("(11) 1234-5678")).toBe(true);
    expect(isValidPhone("91234-5678")).toBe(false);
  });

  it("formata enquanto digita", () => {
    expect(formatPhone("11912345678")).toBe("(11) 91234-5678");
  });
});

describe("Horário de São Paulo", () => {
  it("converte data e hora locais", () => {
    const iso = localToIso("2026-11-24", "10:00");
    expect(iso).toBe("2026-11-24T13:00:00.000Z");
    expect(toDateKey(iso)).toBe("2026-11-24");
    expect(formatTime(iso)).toBe("10:00");
  });
});

describe("Horário no rodapé", () => {
  it("agrupa os dias com o mesmo horário", () => {
    const hours = [
      { weekday: 0, is_open: false, open_time: "09:00:00", close_time: "18:00:00" },
      { weekday: 1, is_open: false, open_time: "09:00:00", close_time: "18:00:00" },
      ...[2, 3, 4, 5].map((weekday) => ({ weekday, is_open: true, open_time: "10:00:00", close_time: "20:00:00" })),
      { weekday: 6, is_open: true, open_time: "09:00:00", close_time: "18:00:00" },
    ];
    expect(summarizeOpeningHours(hours)).toEqual([
      ["Terça a sexta", "10h — 20h"],
      ["Sábado", "09h — 18h"],
      ["Domingo e segunda", "Fechado"],
    ]);
  });
});

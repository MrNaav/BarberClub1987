import { describe, expect, it } from "vitest";
import { safeAdminDestination } from "@/lib/auth/destination";
import { validateDayHours, type DayHours } from "@/components/admin/WeeklyHoursEditor";
import { validateResetPassword } from "@/lib/auth/password";
import { isAppointmentBuffer } from "@/lib/booking/core";

describe("Admin redirect boundary", () => {
  it("rejects external destinations", () => {
    expect(safeAdminDestination("https://example.invalid/admin", "https://barber.example")).toBe("/admin");
  });
  it("accepts only the admin root or its children", () => {
    expect(safeAdminDestination("/administrator", "https://barber.example")).toBe("/admin");
    expect(safeAdminDestination("/admin/agenda", "https://barber.example")).toBe("/admin/agenda");
  });
});

describe("Agenda buffer consistency", () => {
  it("does not show an active appointment buffer as free", () => {
    expect(isAppointmentBuffer("confirmed", 645, 645, 660)).toBe(true);
    expect(isAppointmentBuffer("confirmed", 660, 645, 660)).toBe(false);
  });
  it("cancelled appointments release their buffer", () => {
    expect(isAppointmentBuffer("cancelled", 650, 645, 660)).toBe(false);
  });
});

const day: DayHours = { weekday: 2, enabled: true, start: "10:00", end: "20:00", breakStart: "", breakEnd: "" };
describe("Password reset validation", () => {
  it("requires at least 12 characters", () => {
    expect(validateResetPassword("a".repeat(11), "a".repeat(11))).not.toBeNull();
    expect(validateResetPassword("a".repeat(12), "a".repeat(12))).toBeNull();
  });
  it("requires matching confirmation", () => {
    expect(validateResetPassword("a".repeat(12), "b".repeat(12))).not.toBeNull();
  });
});
describe("Working hours validation", () => {
  it("rejects breaks outside the 10–20 working window", () => {
    expect(validateDayHours([{ ...day, breakStart: "09:00", breakEnd: "11:00" }])).not.toBeNull();
    expect(validateDayHours([{ ...day, breakStart: "12:00", breakEnd: "13:00" }])).toBeNull();
  });
  it("rejects incomplete breaks", () => {
    expect(validateDayHours([{ ...day, breakStart: "12:00" }])).not.toBeNull();
  });
  it("rejects closing before opening", () => {
    expect(validateDayHours([{ ...day, end: "09:00" }])).not.toBeNull();
  });
});
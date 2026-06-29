import { describe, it, expect } from "vitest";

type Invoice = { status: string } | null;

function shouldSkipInvoice(invoice: Invoice): boolean {
  if (!invoice) return true;
  return invoice.status === "PAID";
}

describe("webhook idempotency logic", () => {
  it("should not process already-paid invoice", () => {
    const invoice: Invoice = { status: "PAID" };
    expect(shouldSkipInvoice(invoice)).toBe(true);
  });

  it("should process unpaid invoice", () => {
    const invoice: Invoice = { status: "SENT" };
    expect(shouldSkipInvoice(invoice)).toBe(false);
  });

  it("should process draft invoice", () => {
    const invoice: Invoice = { status: "DRAFT" };
    expect(shouldSkipInvoice(invoice)).toBe(false);
  });

  it("should skip missing invoice", () => {
    const invoice: Invoice = null;
    expect(shouldSkipInvoice(invoice)).toBe(true);
  });
});

describe("PRICE_TO_TIER mapping", () => {
  it("falls back to PRO for unknown priceId", () => {
    const PRICE_TO_TIER: Record<string, string> = {
      "price_pro": "PRO",
      "price_agency": "AGENCY",
      "price_enterprise": "ENTERPRISE",
    };

    const resolve = (priceId: string | undefined): string => {
      if (!priceId) return "PRO";
      return PRICE_TO_TIER[priceId] ?? "PRO";
    };

    expect(resolve("price_pro")).toBe("PRO");
    expect(resolve("price_agency")).toBe("AGENCY");
    expect(resolve("price_enterprise")).toBe("ENTERPRISE");
    expect(resolve("price_unknown")).toBe("PRO");
    expect(resolve(undefined)).toBe("PRO");
  });
});

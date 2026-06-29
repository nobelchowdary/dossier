import { describe, it, expect } from "vitest";
import { invoiceSchema, lineItemSchema, clientSchema, messageSchema } from "@/lib/validators";

describe("lineItemSchema", () => {
  it("validates a valid line item", () => {
    const result = lineItemSchema.safeParse({
      description: "Design work",
      quantity: 2,
      unitPrice: 500,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty description", () => {
    const result = lineItemSchema.safeParse({
      description: "",
      quantity: 1,
      unitPrice: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero quantity", () => {
    const result = lineItemSchema.safeParse({
      description: "Work",
      quantity: 0,
      unitPrice: 100,
    });
    expect(result.success).toBe(false);
  });

  it("allows zero unit price", () => {
    const result = lineItemSchema.safeParse({
      description: "Free item",
      quantity: 1,
      unitPrice: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe("clientSchema", () => {
  it("validates a valid client", () => {
    const result = clientSchema.safeParse({
      companyName: "Acme Corp",
      contactName: "John Doe",
      contactEmail: "john@acme.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = clientSchema.safeParse({
      companyName: "Acme Corp",
      contactName: "John Doe",
      contactEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short company name", () => {
    const result = clientSchema.safeParse({
      companyName: "A",
      contactName: "John Doe",
      contactEmail: "john@acme.com",
    });
    expect(result.success).toBe(false);
  });

  it("parses comma-separated tags", () => {
    const result = clientSchema.safeParse({
      companyName: "Acme Corp",
      contactName: "John Doe",
      contactEmail: "john@acme.com",
      tags: "design, development, consulting",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual(["design", "development", "consulting"]);
    }
  });
});

describe("messageSchema", () => {
  it("validates a valid message", () => {
    const result = messageSchema.safeParse({
      projectId: "clxxx123",
      body: "Hello there",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty body", () => {
    const result = messageSchema.safeParse({
      projectId: "clxxx123",
      body: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects body over 4000 chars", () => {
    const result = messageSchema.safeParse({
      projectId: "clxxx123",
      body: "a".repeat(4001),
    });
    expect(result.success).toBe(false);
  });

  it("defaults attachments to empty array", () => {
    const result = messageSchema.safeParse({
      projectId: "clxxx123",
      body: "Hello",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attachments).toEqual([]);
    }
  });
});

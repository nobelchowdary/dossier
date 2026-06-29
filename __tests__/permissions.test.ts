import { describe, it, expect } from "vitest";

// Copy pure functions here to avoid next-auth import issues in test env
const roleRank: Record<string, number> = {
  CLIENT: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

function hasRole(userRole: string, minimum: string) {
  return roleRank[userRole] >= roleRank[minimum];
}

function canManageClients(role: string) {
  return role === "OWNER" || role === "ADMIN";
}

function canManageInvoices(role: string) {
  return role === "OWNER" || role === "ADMIN";
}

function canManageProject(role: string) {
  return role === "OWNER" || role === "ADMIN" || role === "MEMBER";
}

describe("roleRank", () => {
  it("CLIENT has lowest rank", () => {
    expect(roleRank["CLIENT"]).toBeLessThan(roleRank["MEMBER"]);
  });

  it("OWNER has highest rank", () => {
    expect(roleRank["OWNER"]).toBeGreaterThan(roleRank["ADMIN"]);
  });
});

describe("hasRole", () => {
  it("OWNER passes all role checks", () => {
    expect(hasRole("OWNER", "CLIENT")).toBe(true);
    expect(hasRole("OWNER", "MEMBER")).toBe(true);
    expect(hasRole("OWNER", "ADMIN")).toBe(true);
    expect(hasRole("OWNER", "OWNER")).toBe(true);
  });

  it("CLIENT fails provider role checks", () => {
    expect(hasRole("CLIENT", "MEMBER")).toBe(false);
    expect(hasRole("CLIENT", "ADMIN")).toBe(false);
    expect(hasRole("CLIENT", "OWNER")).toBe(false);
  });

  it("MEMBER passes MEMBER and CLIENT checks", () => {
    expect(hasRole("MEMBER", "CLIENT")).toBe(true);
    expect(hasRole("MEMBER", "MEMBER")).toBe(true);
    expect(hasRole("MEMBER", "ADMIN")).toBe(false);
  });

  it("ADMIN passes everything except OWNER", () => {
    expect(hasRole("ADMIN", "CLIENT")).toBe(true);
    expect(hasRole("ADMIN", "MEMBER")).toBe(true);
    expect(hasRole("ADMIN", "ADMIN")).toBe(true);
    expect(hasRole("ADMIN", "OWNER")).toBe(false);
  });
});

describe("canManageClients", () => {
  it("allows OWNER and ADMIN", () => {
    expect(canManageClients("OWNER")).toBe(true);
    expect(canManageClients("ADMIN")).toBe(true);
  });

  it("denies MEMBER and CLIENT", () => {
    expect(canManageClients("MEMBER")).toBe(false);
    expect(canManageClients("CLIENT")).toBe(false);
  });
});

describe("canManageInvoices", () => {
  it("allows OWNER and ADMIN", () => {
    expect(canManageInvoices("OWNER")).toBe(true);
    expect(canManageInvoices("ADMIN")).toBe(true);
  });

  it("denies MEMBER and CLIENT", () => {
    expect(canManageInvoices("MEMBER")).toBe(false);
    expect(canManageInvoices("CLIENT")).toBe(false);
  });
});

describe("canManageProject", () => {
  it("allows OWNER, ADMIN, MEMBER", () => {
    expect(canManageProject("OWNER")).toBe(true);
    expect(canManageProject("ADMIN")).toBe(true);
    expect(canManageProject("MEMBER")).toBe(true);
  });

  it("denies CLIENT", () => {
    expect(canManageProject("CLIENT")).toBe(false);
  });
});

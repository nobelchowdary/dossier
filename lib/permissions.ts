import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const roleRank: Record<Role, number> = {
  CLIENT: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function hasRole(userRole: Role, minimum: Role) {
  return roleRank[userRole] >= roleRank[minimum];
}

export function canManageClients(role: Role) {
  return role === "OWNER" || role === "ADMIN";
}

export function canManageInvoices(role: Role) {
  return role === "OWNER" || role === "ADMIN";
}

export function canManageProject(role: Role) {
  return role === "OWNER" || role === "ADMIN" || role === "MEMBER";
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function requireProviderUser() {
  const user = await requireUser();
  if (user.role === "CLIENT") redirect("/portal");
  if (!user.organizationId) redirect("/login");
  return user;
}

export async function requireRole(minimum: Role) {
  const user = await requireProviderUser();
  if (!hasRole(user.role, minimum)) {
    redirect("/dashboard");
  }
  return user;
}

export async function requireClientUser() {
  const user = await requireUser();
  if (user.role !== "CLIENT") redirect("/dashboard");
  return user;
}

/**
 * Asserts the current user has access to a project.
 * Throws or redirects on any access violation.
 * Never returns a project from a different org.
 */
export async function assertProjectAccess(projectId: string) {
  const user = await requireUser();

  const project = await prisma.project.findFirst({
    where: { id: projectId },
    include: { client: true, members: true },
  });

  if (!project) notFound();

  if (user.role === "CLIENT") {
    if (project.client.userId !== user.id) notFound();
    return { user, project };
  }

  // Provider-side: hard org check — never allow cross-tenant access
  if (!user.organizationId) redirect("/login");
  if (project.organizationId !== user.organizationId) {
    notFound();
  }

  if (
    user.role === "MEMBER" &&
    !project.members.some((m) => m.userId === user.id)
  ) {
    notFound();
  }

  return { user, project };
}

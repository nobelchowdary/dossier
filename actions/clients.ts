"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canManageClients, requireRole } from "@/lib/permissions";
import { clientSchema } from "@/lib/validators";
import { logActivity } from "@/services/activity";

export async function createClient(formData: FormData) {
  const user = await requireRole("ADMIN");

  if (!canManageClients(user.role) || !user.organizationId) {
    throw new Error("Forbidden");
  }

  const data = clientSchema.parse(Object.fromEntries(formData));

  const existingClient = await prisma.client.findFirst({
    where: {
      contactEmail: data.contactEmail,
      organizationId: user.organizationId,
    },
  });

  if (existingClient) {
    throw new Error("A client with this email already exists.");
  }

  // Find or create a CLIENT user so portal login works
  const existingUser = await prisma.user.findUnique({
    where: { email: data.contactEmail },
  });

  const clientUser =
    existingUser ??
    (await prisma.user.create({
      data: {
        email: data.contactEmail,
        name: data.contactName,
        role: "CLIENT",
        organizationId: user.organizationId,
      },
    }));

  const client = await prisma.client.create({
    data: {
      organizationId: user.organizationId,
      userId: clientUser.id,
      companyName: data.companyName,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      phone: data.phone,
      notes: data.notes,
      tags: data.tags,
    },
  });

  await logActivity({
    organizationId: user.organizationId,
    actorId: user.id,
    action: "client.created",
    targetType: "Client",
    targetId: client.id,
    metadata: { companyName: client.companyName },
  });

  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClient(id: string, formData: FormData) {
  const user = await requireRole("ADMIN");

  if (!user.organizationId) {
    throw new Error("Forbidden");
  }

  const data = clientSchema.parse(Object.fromEntries(formData));

  await prisma.client.update({
    where: { id, organizationId: user.organizationId },
    data: {
      companyName: data.companyName,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      phone: data.phone,
      notes: data.notes,
      tags: data.tags,
    },
  });

  await logActivity({
    organizationId: user.organizationId,
    actorId: user.id,
    action: "client.updated",
    targetType: "Client",
    targetId: id,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}

export async function deleteClient(id: string) {
  const user = await requireRole("ADMIN");

  if (!user.organizationId) {
    throw new Error("Forbidden");
  }

  await prisma.client.delete({
    where: { id, organizationId: user.organizationId },
  });

  await logActivity({
    organizationId: user.organizationId,
    actorId: user.id,
    action: "client.deleted",
    targetType: "Client",
    targetId: id,
  });

  revalidatePath("/clients");
  redirect("/clients");
}
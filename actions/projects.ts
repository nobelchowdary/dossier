"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess, requireProviderUser, requireRole } from "@/lib/permissions";
import { deliverableSchema, milestoneSchema, projectSchema } from "@/lib/validators";
import { logActivity } from "@/services/activity";

function dateOrNull(value?: string) {
  return value ? new Date(value) : null;
}

export async function createProject(formData: FormData) {
  const user = await requireProviderUser();
  if (!user.organizationId) throw new Error("Forbidden");
  const data = projectSchema.parse(Object.fromEntries(formData));

  const client = await prisma.client.findUnique({
    where: { id: data.clientId, organizationId: user.organizationId }
  });
  if (!client) throw new Error("Client not found");

  const project = await prisma.project.create({
    data: {
      organizationId: user.organizationId,
      clientId: data.clientId,
      name: data.name,
      description: data.description,
      status: data.status,
      progressPercent: data.progressPercent,
      startDate: dateOrNull(data.startDate),
      dueDate: dateOrNull(data.dueDate),
      budget: data.budget ? data.budget.toString() : undefined,
      members: { create: { userId: user.id } }
    }
  });

  await logActivity({
    organizationId: user.organizationId,
    actorId: user.id,
    projectId: project.id,
    action: "project.created",
    targetType: "Project",
    targetId: project.id,
    metadata: { name: project.name }
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  const { user, project } = await assertProjectAccess(id);
  if (user.role === "CLIENT") throw new Error("Forbidden");
  const data = projectSchema.parse(Object.fromEntries(formData));

  await prisma.project.update({
    where: { id, organizationId: project.organizationId },
    data: {
      clientId: data.clientId,
      name: data.name,
      description: data.description,
      status: data.status,
      progressPercent: data.progressPercent,
      startDate: dateOrNull(data.startDate),
      dueDate: dateOrNull(data.dueDate),
      budget: data.budget ? data.budget.toString() : null
    }
  });

  await logActivity({
    organizationId: project.organizationId,
    actorId: user.id,
    projectId: id,
    action: "project.updated",
    targetType: "Project",
    targetId: id
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
}

export async function createMilestone(formData: FormData) {
  const user = await requireRole("MEMBER");
  const data = milestoneSchema.parse(Object.fromEntries(formData));
  const { project } = await assertProjectAccess(data.projectId);

  const milestone = await prisma.milestone.create({
    data: {
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      dueDate: dateOrNull(data.dueDate),
      status: data.status,
      sortOrder: data.sortOrder
    }
  });

  await logActivity({
    organizationId: project.organizationId,
    actorId: user.id,
    projectId: project.id,
    action: "milestone.created",
    targetType: "Milestone",
    targetId: milestone.id,
    metadata: { title: milestone.title }
  });

  revalidatePath(`/projects/${project.id}`);
}

export async function updateMilestoneStatus(id: string, status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "APPROVED") {
  const milestone = await prisma.milestone.findUnique({ where: { id }, include: { project: true } });
  if (!milestone) throw new Error("Milestone not found");
  const { user, project } = await assertProjectAccess(milestone.projectId);
  if (user.role === "CLIENT" && status !== "APPROVED") throw new Error("Forbidden");

  await prisma.milestone.update({ where: { id }, data: { status } });
  await logActivity({
    organizationId: project.organizationId,
    actorId: user.id,
    projectId: project.id,
    action: "milestone.status_updated",
    targetType: "Milestone",
    targetId: id,
    metadata: { status }
  });

  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/portal/projects/${project.id}`);
}

export async function createDeliverable(formData: FormData) {
  const data = deliverableSchema.parse(
    Object.fromEntries(formData)
  );

  const { user, project } =
    await assertProjectAccess(data.projectId);

  if (user.role === "CLIENT") {
    throw new Error("Forbidden");
  }

  const deliverable = await prisma.deliverable.create({
    data: {
      projectId: data.projectId,
      milestoneId: data.milestoneId || null,
      title: data.title,
      description: data.description,
      fileKey: data.fileKey,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      status: "SUBMITTED",
      submittedAt: new Date()
    }
  });

  await logActivity({
    organizationId: project.organizationId,
    actorId: user.id,
    projectId: project.id,
    action: "deliverable.uploaded",
    targetType: "Deliverable",
    targetId: deliverable.id,
    metadata: { title: deliverable.title, fileName: deliverable.fileName }
  });

  revalidatePath(`/projects/${project.id}`);
  revalidatePath(`/portal/projects/${project.id}`);
}

export async function approveDeliverable(id: string) {
  const deliverable = await prisma.deliverable.findUnique({ where: { id }, include: { project: true } });
  if (!deliverable) throw new Error("Deliverable not found");
  const { user, project } = await assertProjectAccess(deliverable.projectId);

  if (user.role !== "CLIENT") {
    throw new Error(
      "Only clients can approve deliverables"
    );
  }

  await prisma.deliverable.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date(), revisionNotes: null }
  });
  await logActivity({
    organizationId: project.organizationId,
    actorId: user.id,
    projectId: project.id,
    action: "deliverable.approved",
    targetType: "Deliverable",
    targetId: id
  });

  revalidatePath(`/portal/projects/${project.id}`);
  revalidatePath(`/projects/${project.id}`);
}

export async function requestDeliverableRevision(id: string, formData: FormData) {
  const deliverable = await prisma.deliverable.findUnique({ where: { id }, include: { project: true } });
  if (!deliverable) throw new Error("Deliverable not found");
  const { user, project } =
  await assertProjectAccess(deliverable.projectId);

  if (user.role !== "CLIENT") {
      throw new Error(
    "Only clients can request revisions"
  );
  }
  const revisionNotes = String(formData.get("revisionNotes") ?? "");

  await prisma.deliverable.update({
    where: { id },
    data: { status: "REVISION_REQUESTED", revisionNotes }
  });
  await logActivity({
    organizationId: project.organizationId,
    actorId: user.id,
    projectId: project.id,
    action: "deliverable.revision_requested",
    targetType: "Deliverable",
    targetId: id
  });

  revalidatePath(`/portal/projects/${project.id}`);
  revalidatePath(`/projects/${project.id}`);
}

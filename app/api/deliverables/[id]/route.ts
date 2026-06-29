import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/permissions";
import { z } from "zod";

const deliverablePatchSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REVISION_REQUESTED"]).optional(),
  revisionNotes: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileKey: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().int().optional(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const deliverable = await prisma.deliverable.findUnique({ where: { id } });
  if (!deliverable) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { user } = await assertProjectAccess(deliverable.projectId);

  const parsed = deliverablePatchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  // Clients may only set status to APPROVED or REVISION_REQUESTED + revisionNotes
  if (user.role === "CLIENT") {
    const allowedKeys = new Set(["status", "revisionNotes"]);
    const allowedStatuses = new Set(["APPROVED", "REVISION_REQUESTED"]);
    const hasDisallowedKey = Object.keys(payload).some((k) => !allowedKeys.has(k));
    const hasDisallowedStatus = payload.status && !allowedStatuses.has(payload.status);
    if (hasDisallowedKey || hasDisallowedStatus) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updated = await prisma.deliverable.update({
    where: { id },
    data: {
      ...( payload.title !== undefined && { title: payload.title }),
      ...( payload.description !== undefined && { description: payload.description }),
      ...( payload.status !== undefined && {
        status: payload.status,
        ...(payload.status === "APPROVED" && { approvedAt: new Date() }),
        ...(payload.status === "SUBMITTED" && { submittedAt: new Date() }),
      }),
      ...( payload.revisionNotes !== undefined && { revisionNotes: payload.revisionNotes }),
      ...( payload.fileUrl !== undefined && { fileUrl: payload.fileUrl }),
      ...( payload.fileKey !== undefined && { fileKey: payload.fileKey }),
      ...( payload.fileName !== undefined && { fileName: payload.fileName }),
      ...( payload.fileSize !== undefined && { fileSize: payload.fileSize }),
    },
  });

  return NextResponse.json(updated);
}

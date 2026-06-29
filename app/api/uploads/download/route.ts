import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { assertProjectAccess } from "@/lib/permissions";
import { createDownloadUrl } from "@/services/s3";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const deliverableId = searchParams.get("deliverableId");
    if (!deliverableId) return NextResponse.json({ error: "Missing deliverableId" }, { status: 400 });
    const deliverable = await prisma.deliverable.findUnique({ where: { id: deliverableId } });
    if (!deliverable?.fileKey) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await assertProjectAccess(deliverable.projectId);
    const url = await createDownloadUrl(deliverable.fileKey);
    return NextResponse.redirect(url);
  } catch (error) {
    return errorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { assertProjectAccess } from "@/lib/permissions";
import { buildFileKey, createUploadUrl, publicS3Url } from "@/services/s3";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project } = await assertProjectAccess(body.projectId);
    const key = buildFileKey(project.organizationId, project.id, body.fileName);
    const uploadUrl = await createUploadUrl({ key, contentType: body.contentType });
    return NextResponse.json({ key, uploadUrl, fileUrl: publicS3Url(key) });
  } catch (error) {
    return errorResponse(error);
  }
}

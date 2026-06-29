import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { generateUpdate } from "@/actions/ai";

export async function POST(req: Request) {
  try {
    const { projectId } = await req.json();
    await generateUpdate(projectId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

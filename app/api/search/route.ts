import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

type ProjectResult = {
  id: string;
  name: string;
  description: string | null;
  status: string;
};

type ClientResult = {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
};

type MessageResult = {
  id: string;
  body: string;
  projectId: string;
};

export async function GET(req: Request) {
  const user = await requireRole("MEMBER");
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json({ projects: [], clients: [], messages: [] });
  }

  const orgId = user.organizationId ?? "";

  const [projects, clients, messages] = await Promise.all([
    prisma.$queryRaw`
      SELECT id, name, description, status
      FROM "Project"
      WHERE "organizationId" = ${orgId}
        AND "searchVector" @@ plainto_tsquery('english', ${q})
      ORDER BY ts_rank("searchVector", plainto_tsquery('english', ${q})) DESC
      LIMIT 5
    ` as Promise<ProjectResult[]>,

    prisma.$queryRaw`
      SELECT id, "companyName", "contactName", "contactEmail"
      FROM "Client"
      WHERE "organizationId" = ${orgId}
        AND "searchVector" @@ plainto_tsquery('english', ${q})
      ORDER BY ts_rank("searchVector", plainto_tsquery('english', ${q})) DESC
      LIMIT 5
    ` as Promise<ClientResult[]>,

    prisma.$queryRaw`
      SELECT id, body, "projectId"
      FROM "Message"
      WHERE "projectId" IN (
        SELECT id FROM "Project" WHERE "organizationId" = ${orgId}
      )
        AND "searchVector" @@ plainto_tsquery('english', ${q})
      ORDER BY ts_rank("searchVector", plainto_tsquery('english', ${q})) DESC
      LIMIT 5
    ` as Promise<MessageResult[]>,
  ]);

  return NextResponse.json({ projects, clients, messages });
}

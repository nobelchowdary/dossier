"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export async function updateOrganization(formData: FormData) {
  const user = await requireRole("ADMIN");

  if (!user.organizationId) {
    throw new Error("Forbidden");
  }

  const name = String(formData.get("name") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const logoUrl = String(formData.get("logoUrl") ?? "");
  const brandColor = String(formData.get("brandColor") ?? "");

  await prisma.organization.update({
    where: { id: user.organizationId },
    data: {
      name,
      slug,
      logoUrl: logoUrl || null,
      brandColor: brandColor || "#14b8a6",
    },
  });

  revalidatePath("/settings");
  revalidatePath("/onboarding");
}
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: "acme-studio" },
    update: {},
    create: {
      name: "Acme Studio",
      slug: "acme-studio",
      brandColor: "#14b8a6",
      subscriptionTier: "PRO"
    }
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@dossier.dev" },
    update: {},
    create: {
      email: "owner@dossier.dev",
      name: "Avery Owner",
      role: "OWNER",
      organizationId: organization.id
    }
  });

  const clientUser = await prisma.user.upsert({
    where: { email: "client@example.com" },
    update: {},
    create: {
      email: "client@example.com",
      name: "Jordan Client",
      role: "CLIENT",
      organizationId: organization.id
    }
  });

  const client = await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      organizationId: organization.id,
      userId: clientUser.id,
      companyName: "Northstar Labs",
      contactName: "Jordan Client",
      contactEmail: "client@example.com",
      tags: ["retainer", "priority"]
    }
  });

  const project = await prisma.project.create({
    data: {
      organizationId: organization.id,
      clientId: client.id,
      name: "Website Relaunch",
      description: "A full redesign, content migration, and performance pass for the marketing site.",
      status: "ACTIVE",
      progressPercent: 64,
      budget: "18000",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
      aiSummary: "This week the sitemap was approved, the design system moved into implementation, and the next review is ready for your feedback.",
      members: { create: { userId: owner.id } },
      milestones: {
        create: [
          { title: "Discovery", status: "APPROVED", sortOrder: 1 },
          { title: "Design system", status: "COMPLETED", sortOrder: 2 },
          { title: "Build and QA", status: "IN_PROGRESS", sortOrder: 3 }
        ]
      },
      deliverables: {
        create: [
          {
            title: "Homepage design review",
            description: "Desktop and mobile homepage design for approval.",
            status: "SUBMITTED",
            submittedAt: new Date(),
            fileName: "homepage-review.pdf"
          }
        ]
      }
    }
  });

  await prisma.invoice.create({
    data: {
      organizationId: organization.id,
      clientId: client.id,
      projectId: project.id,
      invoiceNumber: "102",
      status: "SENT",
      amount: "4500",
      currency: "usd",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    }
  });

  await prisma.message.create({
    data: {
      projectId: project.id,
      senderId: owner.id,
      body: "The homepage review is ready. Please approve it or leave revision notes in the portal."
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

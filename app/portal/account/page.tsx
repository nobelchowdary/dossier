import { PortalShell } from "@/components/portal-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireClientUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PortalAccountPage() {
  const user = await requireClientUser();
  const client = await prisma.client.findUnique({ where: { userId: user.id }, include: { organization: true } });

  return (
    <PortalShell>
      <PageHeader title="Account" description="Your portal identity and client profile." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{client?.contactName}</p>
            <p>{client?.contactEmail}</p>
            <p>{client?.phone ?? "No phone on file"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{client?.organization.name}</p>
            <p>{client?.companyName}</p>
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  );
}

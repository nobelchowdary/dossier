import Link from "next/link";
import { MotionPage } from "@/components/motion";
import { ProviderShell } from "@/components/provider-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { updateOrganization } from "@/actions/settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireRole("ADMIN");
  const org = await prisma.organization.findUnique({ where: { id: user.organizationId ?? "" } });

  return (
    <ProviderShell>
      <MotionPage>
      <PageHeader title="Settings" description="Manage workspace branding, team access, billing, and portal operations." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>
              Workspace Branding
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form
              action={updateOrganization}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>
                  Organization Name
                </Label>

                <Input
                  name="name"
                  defaultValue={org?.name ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Workspace Slug
                </Label>

                <Input
                  name="slug"
                  defaultValue={org?.slug ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Logo URL
                </Label>

                <Input
                  name="logoUrl"
                  defaultValue={
                    org?.logoUrl ?? ""
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Subscription Tier
                </Label>

                <Input
                  disabled
                  value={
                    org?.subscriptionTier ??
                    "FREE"
                  }
                />
              </div>

              <Button type="submit">
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader><CardTitle>Administration</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild variant="outline"><Link href="/settings/team">Team</Link></Button>
            <Button asChild variant="outline"><Link href="/settings/billing">Billing</Link></Button>
          </CardContent>
        </Card>
      </div>
      </MotionPage>
    </ProviderShell>
  );
}

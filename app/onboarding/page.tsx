import { redirect } from "next/navigation";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { updateOrganization } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireRole("OWNER");

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId ?? "" },
  });

  if (!org) redirect("/login");

  async function saveAndContinue(formData: FormData) {
    "use server";
    await updateOrganization(formData);
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Welcome to Dossier</h1>
          <p className="text-sm text-muted-foreground">
            Set up your workspace — you can change these any time in Settings.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workspace details</CardTitle>
            <CardDescription>
              This is how your clients will see your brand.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={saveAndContinue} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={org.name}
                  placeholder="Acme Studio"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Portal URL slug
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    your-slug.dossier.app
                  </span>
                  <Input
                    id="slug"
                    name="slug"
                    defaultValue={org.slug}
                    placeholder="acme-studio"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, numbers, and hyphens only.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  defaultValue={org.logoUrl ?? ""}
                  placeholder="https://yoursite.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Paste a direct link to your logo image.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandColor">Brand color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="brandColor"
                    name="brandColor"
                    defaultValue={org.brandColor ?? "#14b8a6"}
                    className="h-10 w-16 cursor-pointer rounded-md border border-input bg-background p-1"
                  />
                  <span className="text-sm text-muted-foreground">
                    Used as the accent color in your client portal.
                  </span>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Save and go to dashboard →
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
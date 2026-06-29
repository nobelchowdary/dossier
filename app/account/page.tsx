import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import { ProviderShell } from "@/components/provider-shell";
import { MotionPage } from "@/components/motion";
import { PageHeader } from "@/components/page-header";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// import { Button } from "@/components/ui/button";
import { initials, formatDate } from "@/lib/utils";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      organization: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <ProviderShell>
      <MotionPage>
        <PageHeader
          title="Account"
          description="Manage your profile and workspace identity."
        />

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border text-2xl font-bold">
                {initials(
                  user.name ??
                  user.email
                )}
              </div>

              <div className="text-center">
                <h2 className="font-semibold text-lg">
                  {user.name}
                </h2>

                <p className="text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Profile Information
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  Full Name
                </p>
                <p className="font-medium">
                  {user.name ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Email
                </p>
                <p className="font-medium">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Role
                </p>
                <p className="font-medium">
                  {user.role}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Organization
                </p>
                <p className="font-medium">
                  {user.organization?.name ??
                    "No Organization"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Member Since
                </p>
                <p className="font-medium">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </MotionPage>
    </ProviderShell>
  );
}
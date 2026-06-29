import { createInvite } from "@/actions/invite";
import {
  deleteInvite,
  // removeMember,
} from "@/actions/team";

import { ProviderShell } from "@/components/provider-shell";
import { PageHeader } from "@/components/page-header";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";

import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

import { Copy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await requireRole("ADMIN");

  const [users, invites] = await Promise.all([
    prisma.user.findMany({
      where: {
        organizationId:
          user.organizationId ?? "",

        role: {
          in: [
            "OWNER",
            "ADMIN",
            "MEMBER",
          ],
        },
      },

      orderBy: {
        createdAt: "asc",
      },
    }),

    prisma.invite.findMany({
      where: {
        organizationId:
          user.organizationId ?? "",

        acceptedAt: null,

        expiresAt: {
          gt: new Date(),
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  return (
    <ProviderShell>
      <PageHeader
        title="Team"
        description="Manage your agency team members and invitations."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* MEMBERS */}
        <Card>
          <CardHeader>
            <CardTitle>
              Team Members
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Role</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>

              <TBody>
                {users.map((member) => (
                  <TR key={member.id}>
                    <TD>
                      {member.name ??
                        "Pending Name"}
                    </TD>

                    <TD>
                      {member.email}
                    </TD>

                    <TD>
                      <Badge>
                        {member.role}
                      </Badge>
                    </TD>
                        
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        {/* INVITES */}
        <Card>
          <CardHeader>
            <CardTitle>
              Invite Team Member
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form
              action={createInvite}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Email</Label>

                <Input
                  name="email"
                  type="email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>

                <select
                  name="role"
                  className="focus-ring h-9 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="MEMBER">
                    MEMBER
                  </option>

                  <option value="ADMIN">
                    ADMIN
                  </option>
                </select>
              </div>

              <Button
                type="submit"
                className="w-full"
              >
                Create Invite
              </Button>
            </form>

            {/* Pending Invites */}
            <div className="mt-8">
              <h3 className="mb-3 text-sm font-medium">
                Pending Invites
              </h3>

              <div className="space-y-3">
                {invites.length === 0 ? (
                  <div className="rounded-md border p-3 text-sm text-muted-foreground">
                    No pending invites
                  </div>
                ) : (
                  invites.map((invite) => {
                    const inviteUrl =
                      `${appUrl}/invite/${invite.token}`;

                    return (
                      <div
                        key={invite.id}
                        className="rounded-md border p-3"
                      >
                        <div className="font-medium">
                          {invite.email}
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          {invite.role}
                          {" • "}
                          expires{" "}
                          {formatDate(
                            invite.expiresAt
                          )}
                        </div>

                        <div className="mt-3 flex gap-2">
                          <Input
                            readOnly
                            value={inviteUrl}
                          />

                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                inviteUrl
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>

                        <form
                          action={deleteInvite.bind(
                            null,
                            invite.id
                          )}
                          className="mt-3"
                        >
                          <Button
                            size="sm"
                            variant="destructive"
                          >
                            Cancel Invite
                          </Button>
                        </form>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProviderShell>
  );
}
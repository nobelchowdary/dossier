import Link from "next/link";
import { createClient } from "@/actions/clients";
import { inviteClient } from "@/actions/client-invite";

import { MotionPage } from "@/components/motion";
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
import { EmptyState } from "@/components/ui/empty-state";
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
import { Textarea } from "@/components/ui/textarea";

import { requireProviderUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

    const user = await requireProviderUser();

    const clients = await prisma.client.findMany({
      where: {
        organizationId:
          user.organizationId ?? "",

        OR: q
          ? [
              {
                companyName: {
                  contains: q,
                  mode: "insensitive",
                },
              },
              {
                contactName: {
                  contains: q,
                  mode: "insensitive",
                },
              },
              {
                contactEmail: {
                  contains: q,
                  mode: "insensitive",
                },
              },
            ]
          : undefined,
      },

      include: {
        projects: true,
        user: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  return (
    <ProviderShell>
      <MotionPage>
        <PageHeader
          title="Clients"
          description="Create, search, and manage every client relationship in one polished workspace."
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* CLIENT LIST */}
          <Card>
            <CardHeader>
              <form className="flex gap-2">
                <Input
                  name="q"
                  placeholder="Search clients"
                  defaultValue={q}
                />

                <Button
                  type="submit"
                  variant="outline"
                >
                  Search
                </Button>
              </form>
            </CardHeader>

            <CardContent>
              {clients.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No clients found"
                  description="Add a client to create their portal, assign projects, and centralize files and invoices."
                />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Company</TH>
                      <TH>Contact</TH>
                      <TH>Projects</TH>
                      <TH>Created</TH>
                      <TH>Portal</TH>
                    </TR>
                  </THead>

                  <TBody>
                    {clients.map((client) => (
                      <TR key={client.id}>
                        <TD>
                          <Link
                            href={`/clients/${client.id}`}
                            className="font-medium hover:underline"
                          >
                            {client.companyName}
                          </Link>
                        </TD>

                        <TD>
                          {client.contactName}

                          <div className="text-xs text-muted-foreground">
                            {client.contactEmail}
                          </div>
                        </TD>

                        <TD>
                          {client.projects.length}
                        </TD>

                        <TD>
                          {formatDate(
                            client.createdAt
                          )}
                        </TD>

                        <TD>
                          {client.user ? (
                            <Badge>
                              Portal Active
                            </Badge>
                          ) : (
                            <form
                              action={inviteClient.bind(
                                null,
                                client.id
                              )}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                              >
                                Invite Client
                              </Button>
                            </form>
                          )}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* CREATE CLIENT */}
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>
                New Client
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form
                action={createClient}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>
                    Company
                  </Label>

                  <Input
                    name="companyName"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Contact Name
                  </Label>

                  <Input
                    name="contactName"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>

                  <Input
                    name="contactEmail"
                    type="email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>

                  <Input name="phone" />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>

                  <Input
                    name="tags"
                    placeholder="retainer, design"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>

                  <Textarea name="notes" />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                >
                  Create Client
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </MotionPage>
    </ProviderShell>
  );
}
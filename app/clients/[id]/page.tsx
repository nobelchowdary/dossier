import Link from "next/link";
import { updateClient } from "@/actions/clients";
import { ProviderShell } from "@/components/provider-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { requireProviderUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {

  const { id } = await params;

  
  const user = await requireProviderUser();
  
  const client = await prisma.client.findFirst({
  where: {
    id,
    organizationId: user.organizationId ?? "",
  },
  include: {
    projects: true,
    invoices: {
      include: {
        project: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    },
  },
});

if (!client) {
  notFound();
}

const save = updateClient.bind(null, client.id);
  return (
    <ProviderShell>
      <PageHeader title={client.companyName} description={`${client.contactName} · ${client.contactEmail}`} />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent>
            <form action={save}
            className="space-y-4">
              <div className="space-y-2"><Label>Company</Label><Input name="companyName" defaultValue={client.companyName} /></div>
              <div className="space-y-2"><Label>Contact</Label><Input name="contactName" defaultValue={client.contactName} /></div>
              <div className="space-y-2"><Label>Email</Label><Input name="contactEmail" type="email" defaultValue={client.contactEmail} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input name="phone" defaultValue={client.phone ?? ""} /></div>
              <div className="space-y-2"><Label>Tags</Label><Input name="tags" defaultValue={client.tags.join(", ")} /></div>
              <div className="space-y-2"><Label>Notes</Label><Textarea name="notes" defaultValue={client.notes ?? ""} /></div>
              <Button type="submit">Save changes</Button>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <THead><TR><TH>Name</TH><TH>Status</TH><TH>Due</TH></TR></THead>
                <TBody>
                  {client.projects.map(
                    (project) => (
                    <TR key={project.id}>
                      <TD><Link href={`/projects/${project.id}`} className="font-medium hover:underline">{project.name}</Link></TD>
                      <TD><Badge>{project.status}</Badge></TD>
                      <TD>  
                        {project.dueDate
                        ? formatDate(project.dueDate)
                        : "No due date"}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <THead><TR><TH>Number</TH><TH>Project</TH><TH>Status</TH><TH>Amount</TH></TR></THead>
                <TBody>
                  {client.invoices.map((invoice) => (
                    <TR key={invoice.id}>
                      <TD><Link href={`/invoices/${invoice.id}`} className="font-medium hover:underline">{invoice.invoiceNumber}</Link></TD>
                      <TD>{invoice.project.name}</TD>
                      <TD><Badge>{invoice.status}</Badge></TD>
                      <TD>
                      {formatCurrency(
                        Number(invoice.amount)
                      )}
                    </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProviderShell>
  );
}

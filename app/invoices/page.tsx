import { createInvoice } from "@/actions/invoices";
import { KpiCard } from "@/components/analytics";
import { MotionPage } from "@/components/motion";
import { ProviderShell } from "@/components/provider-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreditCard, Receipt, TrendingUp } from "lucide-react";
import Link from "next/link";
import InvoiceForm from "./invoice-form";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const user = await requireRole("ADMIN");

  const [invoices, projects, clients] = await Promise.all([
    prisma.invoice.findMany({
      where: { organizationId: user.organizationId ?? "" },
      include: { client: true, project: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: { organizationId: user.organizationId ?? "" },
      include: { client: true },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({
      where: { organizationId: user.organizationId ?? "" },
      orderBy: { companyName: "asc" },
    }),
  ]);

  const paid = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const outstanding = invoices
    .filter((i) => i.status !== "PAID" && i.status !== "CANCELLED")
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <ProviderShell>
      <MotionPage>
        <PageHeader
          title="Invoices"
          description="Create invoices, send Stripe payment links, and track paid status."
        />
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <KpiCard
            label="Paid revenue"
            value={formatCurrency(paid)}
            detail="Marked paid by Stripe webhooks."
            icon={TrendingUp}
            tone="success"
          />
          <KpiCard
            label="Outstanding"
            value={formatCurrency(outstanding)}
            detail="Awaiting client payment."
            icon={CreditCard}
            tone="warning"
          />
          <KpiCard
            label="Invoices"
            value={invoices.length}
            detail="Draft, sent, viewed, and paid invoices."
            icon={Receipt}
            tone="accent"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <Card className="glass-panel">
            <CardContent className="pt-5">
              <Table>
                <THead>
                  <TR>
                    <TH>Number</TH>
                    <TH>Client</TH>
                    <TH>Project</TH>
                    <TH>Status</TH>
                    <TH>Amount</TH>
                    <TH>Due</TH>
                  </TR>
                </THead>
                <TBody>
                  {invoices.map((invoice) => (
                    <TR key={invoice.id}>
                      <TD>
                        <Link
                          href={`/invoices/${invoice.id}`}
                          className="font-medium hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </TD>
                      <TD>{invoice.client.companyName}</TD>
                      <TD>{invoice.project.name}</TD>
                      <TD><Badge>{invoice.status}</Badge></TD>
                      <TD>{formatCurrency(Number(invoice.amount))}</TD>
                      <TD>{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>New invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceForm
                clients={clients.map((c) => ({
                  id: c.id,
                  companyName: c.companyName,
                }))}
                projects={projects.map((p) => ({
                  id: p.id,
                  name: p.name,
                  clientName: p.client.companyName,
                  clientId: p.clientId,
                }))}
                createInvoice={createInvoice}
              />
            </CardContent>
          </Card>
        </div>
      </MotionPage>
    </ProviderShell>
  );
}
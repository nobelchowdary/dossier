import { CheckoutButton } from "@/components/checkout-button";
import { PortalShell } from "@/components/portal-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireClientUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalInvoicesPage() {
  const user = await requireClientUser();
  const invoices = await prisma.invoice.findMany({
    where: { client: { userId: user.id } },
    include: { project: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <PortalShell>
      <PageHeader title="Invoices" description="View outstanding invoices and pay securely with Stripe." />
      <Card>
        <CardContent className="pt-5">
          <Table>
            <THead><TR><TH>Invoice</TH><TH>Project</TH><TH>Status</TH><TH>Amount</TH><TH>Due</TH><TH /></TR></THead>
            <TBody>
              {invoices.map((invoice) => (
                <TR key={invoice.id}>
                  <TD>{invoice.invoiceNumber}</TD>
                  <TD>{invoice.project.name}</TD>
                  <TD><Badge>{invoice.status}</Badge></TD>
                  <TD>{Number((invoice.amount))}</TD>
                  <TD>{invoice.dueDate
                      ? formatDate(invoice.dueDate)
                      : "No due date"}</TD>
                  <TD>{invoice.status !== "PAID" ? <CheckoutButton invoiceId={invoice.id} /> : null}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </PortalShell>
  );
}

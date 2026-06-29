import { notFound } from "next/navigation";
import { sendInvoice } from "@/actions/invoices";
import { CheckoutButton } from "@/components/checkout-button";
import { ProviderShell } from "@/components/provider-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { LineItem } from "@/lib/validators";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("ADMIN");

  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: user.organizationId ?? "" },
    include: { client: true, project: true },
  });

  if (!invoice) notFound();

  const lineItems = (invoice.lineItems ?? []) as LineItem[];

  return (
    <ProviderShell>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description={`${invoice.client.companyName} · ${invoice.project.name}`}
        actions={
          <form action={sendInvoice.bind(null, invoice.id)}>
            <Button type="submit" variant="outline">
              Send invoice
            </Button>
          </form>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent><Badge>{invoice.status}</Badge></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total amount</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(Number(invoice.amount))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Due date</CardTitle></CardHeader>
          <CardContent>
            {invoice.dueDate ? formatDate(invoice.dueDate) : "No due date"}
          </CardContent>
        </Card>
      </div>

      {lineItems.length > 0 && (
        <Card className="mt-6">
          <CardHeader><CardTitle>Line items</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium text-right">Qty</th>
                  <th className="pb-2 font-medium text-right">Unit price</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-3 text-right font-medium">
                    Total
                  </td>
                  <td className="pt-3 text-right text-lg font-semibold">
                    {formatCurrency(Number(invoice.amount))}
                  </td>
                </tr>
              </tfoot>
            </table>

            {invoice.notes && (
              <div className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Notes: </span>
                {invoice.notes}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Stripe checkout is created when the invoice is sent. Webhooks mark
            this invoice paid automatically.
          </div>
          <CheckoutButton invoiceId={invoice.id} />
        </CardContent>
      </Card>
    </ProviderShell>
  );
}

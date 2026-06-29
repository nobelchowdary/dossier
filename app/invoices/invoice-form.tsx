"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import type { LineItem } from "@/lib/validators";

interface Props {
  clients: { id: string; companyName: string }[];
  projects: { id: string; name: string; clientName: string; clientId: string }[];
  createInvoice: (formData: FormData) => Promise<void>;
}

const emptyLine = (): LineItem => ({
  description: "",
  quantity: 1,
  unitPrice: 0,
});

export default function InvoiceForm({ clients, projects, createInvoice }: Props) {
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()]);

  const total = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  function updateLine(index: number, field: keyof LineItem, value: string) {
    setLineItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]:
                field === "description" ? value : parseFloat(value) || 0,
            }
          : item
      )
    );
  }

  function addLine() {
    setLineItems((prev) => [...prev, emptyLine()]);
  }

  function removeLine(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(formData: FormData) {
    formData.set("lineItems", JSON.stringify(lineItems));
    await createInvoice(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Invoice number</Label>
        <Input name="invoiceNumber" placeholder="INV-001" required />
      </div>

      <div className="space-y-2">
        <Label>Client</Label>
        <select
          name="clientId"
          className="focus-ring h-9 w-full rounded-md border bg-background px-3 text-sm"
          required
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Project</Label>
        <select
          name="projectId"
          className="focus-ring h-9 w-full rounded-md border bg-background px-3 text-sm"
          required
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.clientName}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Line items</Label>
          <button
            type="button"
            onClick={addLine}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" /> Add row
          </button>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_56px_72px_24px] gap-1 text-xs text-muted-foreground px-1">
            <span>Description</span>
            <span>Qty</span>
            <span>Price</span>
            <span />
          </div>

          {lineItems.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_56px_72px_24px] gap-1 items-center"
            >
              <Input
                value={item.description}
                onChange={(e) => updateLine(index, "description", e.target.value)}
                placeholder="Service description"
                required
              />
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateLine(index, "quantity", e.target.value)}
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => updateLine(index, "unitPrice", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeLine(index)}
                disabled={lineItems.length === 1}
                className="text-muted-foreground hover:text-destructive disabled:opacity-30"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-1">
          <span className="text-sm font-medium">
            Total: ${total.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Currency</Label>
          <Input name="currency" defaultValue="usd" maxLength={3} />
        </div>
        <div className="space-y-2">
          <Label>Due date</Label>
          <Input name="dueDate" type="date" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          name="notes"
          placeholder="Payment terms, bank details, thank you note..."
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full">
        Create invoice
      </Button>
    </form>
  );
}
"use client";

import { useTransition } from "react";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CheckoutButton({ invoiceId, label = "Pay invoice" }: { invoiceId: string; label?: string }) {
  const [isPending, startTransition] = useTransition();

  function checkout() {
    startTransition(async () => {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId })
      });
      if (!response.ok) return;
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    });
  }

  return (
    <Button type="button" onClick={checkout} disabled={isPending}>
      <CreditCard className="h-4 w-4" />
      {label}
    </Button>
  );
}

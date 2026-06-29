import { Button } from "@/components/ui/button";

export default function PaymentPage() {
  return (
    <div className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-bold mb-4">
        Invoice Payment
      </h1>

      <div className="rounded-lg border p-6 space-y-4">
        <p>Invoice: INV-101</p>
        <p>Amount: ₹5,000</p>

        <Button className="w-full">
          Pay Now
        </Button>
      </div>
    </div>
  );
}
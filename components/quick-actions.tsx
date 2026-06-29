import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Send, Sparkles, Upload } from "lucide-react";

export function QuickActions() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <Button asChild variant="outline" className="justify-start">
        <Link href="/clients"><Plus className="h-4 w-4" />Client</Link>
      </Button>
      <Button asChild variant="outline" className="justify-start">
        <Link href="/projects"><Sparkles className="h-4 w-4" />Project</Link>
      </Button>
      <Button asChild variant="outline" className="justify-start">
        <Link href="/invoices"><Send className="h-4 w-4" />Invoice</Link>
      </Button>
      <Button asChild variant="outline" className="justify-start">
        <Link href="/projects"><Upload className="h-4 w-4" />Deliverable</Link>
      </Button>
    </div>
  );
}

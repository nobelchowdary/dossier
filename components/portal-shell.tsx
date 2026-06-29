import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { CreditCard, FolderKanban, MessageSquare, UserRound } from "lucide-react";
// import { ProfileMenu } from "@/components/profile-menu"
import { initials} from "@/lib/utils"


const nav = [
  { href: "/portal", label: "Projects", icon: FolderKanban },
  { href: "/portal/messages", label: "Messages", icon: MessageSquare },
  { href: "/portal/invoices", label: "Invoices", icon: CreditCard },
  { href: "/portal/account", label: "Account", icon: UserRound }
];

export async function PortalShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const client = session?.user.id
    ? await prisma.client.findUnique({ where: { userId: session.user.id }, include: { organization: true } })
    : null;
  const color = client?.organization.brandColor ?? "#14b8a6";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background" style={{ "--portal-accent": color } as React.CSSProperties}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80" style={{ background: `linear-gradient(135deg, ${color}24, transparent 62%)` }} />
      <header className="sticky top-0 z-20 border-b bg-card/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/portal" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-lg" style={{ background: color }}>
              {client?.organization.logoUrl ? <Image src={client.organization.logoUrl} alt="" width={32} height={32} className="rounded-md" /> : initials(client?.organization.name)}
            </div>
            <div>
              <p className="text-sm font-semibold">{client?.organization.name ?? "Dossier Portal"}</p>
              <p className="text-xs text-muted-foreground">{client?.companyName ?? session?.user.email}</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-lg"
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              ))}
            </nav>

            <form
              action={async () => {
                "use server";
                const { signOut } = await import("@/lib/auth");
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="flex h-9 w-9 items-center justify-center rounded-full border bg-card text-xs font-semibold shadow-sm hover:bg-muted"
                title="Logout"
              >
                {initials(
                  client?.contactName ??
                  session?.user.email ??
                  "C"
                )}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}


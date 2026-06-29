import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/command-palette";
import { BarChart3, Bell, BriefcaseBusiness, CreditCard, FolderKanban, Menu, Settings, Users } from "lucide-react";
import { ProfileMenu } from "@/components/profile-menu";
import { initials} from "@/lib/utils"

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/invoices", label: "Invoices", icon: CreditCard },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];


export async function ProviderShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const organization = session?.user.organizationId
    ? await prisma.organization.findUnique({ where: { id: session.user.organizationId } })
    : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="premium-grid pointer-events-none fixed inset-x-0 top-0 h-72 opacity-60" />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r bg-card/75 p-4 shadow-[20px_0_60px_rgba(15,23,42,0.04)] backdrop-blur-xl md:block">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-950 to-slate-700 text-primary-foreground shadow-lg dark:from-white dark:to-slate-300 dark:text-slate-950">
            {organization?.logoUrl ? <Image src={organization.logoUrl} alt="" width={28} height={28} className="rounded-md" /> : <BriefcaseBusiness className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-sm font-semibold tracking-normal">Dossier</p>
            <p className="text-xs text-muted-foreground">{organization?.name ?? "Workspace"}</p>
          </div>
        </Link>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Button key={item.href} asChild variant="ghost" className="h-10 w-full justify-start rounded-lg">
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="absolute inset-x-4 bottom-4 rounded-lg border bg-background/70 p-3">
          <div className="text-xs font-medium">Workspace health</div>
          <div className="mt-1 text-xs text-muted-foreground">Client delivery, billing, and activity stay synced here.</div>
        </div>
      </aside>
      <header className="sticky top-0 z-20 border-b bg-background/70 backdrop-blur-xl md:ml-72">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="font-semibold">Dossier</span>
          </div>
          <div className="hidden text-sm text-muted-foreground md:block">Client portal and project operations</div>
          <div className="flex items-center gap-2">
            <CommandPalette />
              <div className="relative">
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                >
                  <Link href="/notifications">
                    <Bell className="h-4 w-4" />
                  </Link>
                </Button>

                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  5
                </span>
              </div>
              <ProfileMenu
                initials={initials(
                  session?.user.name ??
                  session?.user.email ??
                  "U"
                )}
              />
          </div>
        </div>
      </header>
      <main className="relative px-4 py-8 md:ml-72 md:px-8 xl:px-10">{children}</main>
    </div>
  );
}


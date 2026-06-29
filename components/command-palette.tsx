"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BriefcaseBusiness,
  CreditCard,
  FolderKanban,
  Search,
  Settings,
  Users,

  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BriefcaseBusiness },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/invoices", label: "Invoices", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

type SearchResults = {
  projects: { id: string; name: string; description: string | null; status: string }[];
  clients: { id: string; companyName: string; contactName: string; contactEmail: string }[];
  messages: { id: string; body: string; projectId: string }[];
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredNav = navItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function close() {
    setOpen(false);
    setQuery("");
    setResults(null);
  }

  const hasResults =
    results &&
    (results.projects.length > 0 ||
      results.clients.length > 0 ||
      results.messages.length > 0);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="hidden w-72 justify-start text-muted-foreground lg:flex"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        Search or jump to...
        <span className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[10px]">
          Ctrl K
        </span>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <motion.div
              className="mx-auto mt-24 w-[min(560px,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-card shadow-2xl"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 flex-1 bg-transparent text-sm outline-none"
                  placeholder="Search projects, clients, messages..."
                />
                {loading && (
                  <span className="text-xs text-muted-foreground">Searching...</span>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto p-2">
                {!query && (
                  <>
                    <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      Navigation
                    </p>
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={close}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                      >
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        {item.label}
                      </Link>
                    ))}
                  </>
                )}

                {query && !hasResults && !loading && (
                  <>
                    {filteredNav.length > 0 && (
                      <>
                        <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                          Navigation
                        </p>
                        {filteredNav.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={close}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                          >
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            {item.label}
                          </Link>
                        ))}
                      </>
                    )}
                    {query.length >= 2 && (
                      <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No results for &ldquo;{query}&rdquo;
                      </p>
                    )}
                  </>
                )}

                {hasResults && (
                  <>
                    {results.projects.length > 0 && (
                      <>
                        <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                          Projects
                        </p>
                        {results.projects.map((p) => (
                          <Link
                            key={p.id}
                            href={`/projects/${p.id}`}
                            onClick={close}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                          >
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 truncate">{p.name}</span>
                            <span className="text-xs text-muted-foreground">{p.status}</span>
                          </Link>
                        ))}
                      </>
                    )}

                    {results.clients.length > 0 && (
                      <>
                        <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                          Clients
                        </p>
                        {results.clients.map((c) => (
                          <Link
                            key={c.id}
                            href={`/clients/${c.id}`}
                            onClick={close}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                          >
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 truncate">{c.companyName}</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {c.contactEmail}
                            </span>
                          </Link>
                        ))}
                      </>
                    )}

                    {results.messages.length > 0 && (
                      <>
                        <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                          Messages
                        </p>
                        {results.messages.map((m) => (
                          <Link
                            key={m.id}
                            href={`/projects/${m.projectId}`}
                            onClick={close}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                          >
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 truncate text-muted-foreground">
                              {m.body}
                            </span>
                          </Link>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

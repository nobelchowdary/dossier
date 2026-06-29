"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface Props {
  redirectTo?: string;
}

export function LogoutButton({
  redirectTo = "/login"
}: Props) {
  return (
    <button
      onClick={() =>
        signOut({
          callbackUrl: redirectTo
        })
      }
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}
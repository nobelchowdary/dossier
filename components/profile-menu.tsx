"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import { logout } from "@/actions/auth";
import { signOut } from "next-auth/react";

type Props = {
  initials: string;
};

export function ProfileMenu({
  initials,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border bg-card text-xs font-semibold shadow-sm hover:bg-muted"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-48"
      >
        <DropdownMenuItem asChild>
          <Link href="/account">
            <User className="mr-2 h-4 w-4" />
            Account
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
            onClick={() =>
                signOut({
                callbackUrl: "/login",
                })
            }
            >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
            </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
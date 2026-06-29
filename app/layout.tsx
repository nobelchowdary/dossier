import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/provider";

export const metadata: Metadata = {
  title: "Dossier",
  description:
    "A branded client portal and project management platform for service businesses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import "./globals.css";
import "@/features/otsjoba/account.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://thodh.com"),
  title: "Otsjoba · Litt øving. Mer flyt.",
  description:
    "Øv på italiensk og russisk med veiledede samtaler, ordtrening og egne språktutorer.",
  alternates: { canonical: "/otsjoba" },
  icons: { icon: "/otsjoba/favicon.svg" },
};

export default function OtsjobaLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nb">
      <body className="antialiased">{children}</body>
    </html>
  );
}

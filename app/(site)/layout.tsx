import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { UtfordringVarsler } from "@/features/spill/components/utfordring-varsler";
import { supabaseConfig } from "@/lib/supabase/config";
import "./globals.css";

// Only Latin is preloaded; the other subsets stay in the CSS and are fetched when a page needs them.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thodh.com"),
  title: {
    default: "Thomas — thodh.com",
    template: "%s — thodh.com",
  },
  description:
    "Student. Boler. Vibekoder.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const { url, key } = supabaseConfig();
  return (
    <html
      lang="nb"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        {children}
        <UtfordringVarsler supabaseUrl={url} supabaseNokkel={key} />
        {/* Cookie-free visitor counts (Vercel Web Analytics), to see how many play each day. */}
        <Analytics />
      </body>
    </html>
  );
}

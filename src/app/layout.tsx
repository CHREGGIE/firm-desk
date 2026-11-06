import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { Desk } from "@/components/desk";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const sans = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: {
    default: "Calder & Wren",
    template: "%s · Calder & Wren",
  },
  description:
    "A Providence firm for employment disputes, business conflicts, estates, and home closings. Ask the desk, or request a 30-minute consultation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <div id="content" className="flex-1">{children}</div>
        <SiteFooter />
        <Desk />
      </body>
    </html>
  );
}

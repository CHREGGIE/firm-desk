import type { ReactNode } from "react";
import { Desk } from "@/components/desk";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <div id="content" className="flex-1">
        {children}
      </div>
      <SiteFooter />
      <Desk />
    </>
  );
}

import { Desk } from "@/components/desk";
import { MissingPage } from "@/components/missing-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <div id="content" className="flex-1">
        <MissingPage />
      </div>
      <SiteFooter />
      <Desk />
    </>
  );
}

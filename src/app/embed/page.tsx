import type { Metadata } from "next";
import { Desk } from "@/components/desk";

export const metadata: Metadata = {
  title: "Ask the desk",
  robots: { index: false, follow: false },
};

export default function EmbedPage() {
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <Desk variant="embed" />
    </div>
  );
}

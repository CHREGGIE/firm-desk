import type { Metadata } from "next";
import { SquarespaceGuide } from "@/components/squarespace-guide";

export const metadata: Metadata = {
  title: "Add the desk to Squarespace",
  description:
    "Paste one snippet into a Squarespace site so the Calder & Wren desk sits on every page.",
};

export default function SquarespacePage() {
  return <SquarespaceGuide />;
}

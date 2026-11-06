import type { Metadata } from "next";
import { SquarespaceGuide } from "@/components/squarespace-guide";

export const metadata: Metadata = {
  title: "Add the desk to Squarespace",
  description:
    "Paste one snippet into ainsworthgorkin.com so the intake desk sits on the Squarespace site.",
};

export default function SquarespacePage() {
  return <SquarespaceGuide />;
}

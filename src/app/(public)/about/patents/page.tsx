import type { Metadata } from "next";
import PatentsClient from "./PatentsClient";

export const metadata: Metadata = {
  title: "Patents",
  description:
    "Petromac's granted patents for Wireline Express, Pathfinder, and Focus precision centraliser technologies.",
};

export default function PatentsPage() {
  return <PatentsClient />;
}

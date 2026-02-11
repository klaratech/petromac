import ContactForm from "@/components/public/ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Petromac for wireline logging solutions, product enquiries, or to request an Athena demo.",
};

export default function ContactPage() {
  return (
    <div>
      <ContactForm />
    </div>
  );
}

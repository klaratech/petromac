import Hero from "@/components/public/Hero";
import ProblemSection from "@/components/public/ProblemSection";
import ProductTeaser from "@/components/public/ProductTeaser";
import ContactForm from "@/components/public/ContactForm";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ProblemSection />
      <ProductTeaser />
      <ContactForm />
    </main>
  );
}

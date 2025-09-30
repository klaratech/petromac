import Hero from "@/components/public/Hero";
import ProblemSection from "@/components/public/ProblemSection";
import ProductTeaser from "@/components/public/ProductTeaser";
import Footer from "@/components/public/Footer";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <ProblemSection />
      <ProductTeaser />
      <Footer />
    </main>
  );
}

import Footer from "@/components/shared/Footer";

export default function IntranetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}

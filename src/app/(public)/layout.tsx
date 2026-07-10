import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import OperationsDataPrefetch from '@/components/public/OperationsDataPrefetch';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OperationsDataPrefetch />
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}

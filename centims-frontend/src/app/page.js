import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Market from '@/components/Market';
import RankingSection from '@/components/RankingSection';
import Patrocinadors from '@/components/Patrocinadors';
import Learn from '@/components/Learn';
import AboutUs from '@/components/AboutUs';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Centims - Tokens catalans. Apren jugant.',
  description: 'Compra, observa i apren amb un mercat ludic de tokens inspirats en cultura catalana.',
};

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Market />
      <RankingSection />
      <Patrocinadors />
      <Learn />
      <AboutUs />
      <Footer />
    </main>
  );
}

import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Market from '@/components/Market';
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
      <Learn />
      <AboutUs />
      <Footer />
    </main>
  );
}

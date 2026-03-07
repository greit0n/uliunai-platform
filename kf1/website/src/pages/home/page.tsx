import { Link } from 'react-router-dom';
import Navigation from '../../components/feature/Navigation';
import Footer from '../../components/feature/Footer';
import LiveScoreboard from '../../components/feature/LiveScoreboard';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import ServerInfoSection from './components/ServerInfoSection';
import GallerySection from './components/GallerySection';
import NewsSection from './components/NewsSection';
import AdminSection from './components/AdminSection';
import VipSection from './components/VipSection';
import ContactSection from './components/ContactSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <main>
        <HeroSection />
        <section id="scoreboard" className="relative z-10 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-orbitron horror-heading">
                Live <span className="text-red-500">Scoreboard</span>
              </h2>
              <div className="w-24 h-1 bg-red-600 mx-auto mb-4"></div>
              <p className="text-gray-400 max-w-xl mx-auto">See who's fighting right now — updated in real-time every 5 seconds</p>
            </div>
            <LiveScoreboard />
            <div className="mt-6 text-center">
              <Link to="/stats" className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors text-sm font-medium group">
                <i className="ri-bar-chart-grouped-line"></i>
                View All-Time Player Stats
                <i className="ri-arrow-right-s-line group-hover:translate-x-0.5 transition-transform"></i>
              </Link>
            </div>
          </div>
        </section>
        <AboutSection />
        <ServerInfoSection />
        <GallerySection />
        <NewsSection />
        <AdminSection />
        <VipSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}

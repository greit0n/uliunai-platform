import Navigation from '../../components/feature/Navigation';
import Footer from '../../components/feature/Footer';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import ServerInfoSection from './components/ServerInfoSection';
import GallerySection from './components/GallerySection';
import NewsSection from './components/NewsSection';
import AdminSection from './components/AdminSection';
import VipSection from './components/VipSection';
import ContactSection from './components/ContactSection';

/**
 * Home page component containing all main sections of the website.
 * 
 * @description The main landing page that composes all section components
 * including hero, about, server info, gallery, news, admin, VIP, and contact sections.
 * Wrapped with navigation and footer components.
 * 
 * @returns {JSX.Element} The home page component
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <main>
        <HeroSection />
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

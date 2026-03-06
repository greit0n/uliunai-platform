import Button from '../../../components/base/Button';
import LiveStats from '../../../components/feature/LiveStats';
import { useScrollReveal } from '@/hooks/useScrollReveal';

/**
 * HeroSection component displaying the main landing section.
 * 
 * @description The hero section serves as the primary landing area with the site title,
 * tagline, call-to-action buttons, live server stats, and a scroll indicator.
 * Features a dark horror-themed background with gradient overlays.
 * 
 * @returns {JSX.Element} The hero section component
 */
export default function HeroSection() {
  const sectionRef = useScrollReveal();

  /**
   * Opens the Steam client to connect to the game server.
   *
   * @description Uses the Steam protocol handler to launch the game client
   * and connect directly to the server at uliunai.lt:7707.
   */
  const handleJoinServer = () => {
    window.open('steam://connect/51.195.117.236:9980', '_blank');
  };

  /**
   * Scrolls smoothly to the About section.
   * 
   * @description Finds the about section element and scrolls to it using
   * smooth scrolling behavior. Used by the scroll-down arrow indicator.
   */
  const handleScrollToNext = () => {
    const element = document.getElementById('about');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center relative"
    >
      {/* Background image layer — fades out at bottom so fog bleeds through */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url('https://readdy.ai/api/search-image?query=dark%20horror%20zombie%20apocalypse%20laboratory%20with%20blood%20stains%20and%20broken%20equipment%2C%20industrial%20setting%20with%20red%20emergency%20lighting%2C%20gritty%20atmosphere%2C%20Killing%20Floor%20game%20style%20environment%20with%20metal%20corridors%20and%20warning%20signs%2C%20post-apocalyptic%20facility&width=1920&height=1080&seq=hero-bg&orientation=landscape')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent z-[1]"></div>
      
      <div className="container mx-auto px-4 relative z-10" ref={sectionRef}>
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="glitch-subtle text-6xl md:text-8xl font-black text-white mb-6 font-orbitron">
            <span className="text-red-500">ULIUNAI</span>
            <span className="text-white">.LT</span>
          </h1>

          <p className="scroll-reveal text-xl md:text-2xl text-gray-300 mb-8 font-rajdhani">
            The <strong className="text-red-400">Longest-Running</strong> Killing Floor 1 Server
          </p>

          <p className="scroll-reveal text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            Join our legendary community with custom weapons, maps, monsters, and years of non-stop action.
            Experience the ultimate Killing Floor adventure with friendly players and active admins.
          </p>

          <div className="scroll-reveal flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              variant="primary"
              size="lg"
              onClick={handleJoinServer}
              className="pulse-glow flex items-center gap-3"
            >
              <i className="ri-gamepad-fill text-xl"></i>
              Join Server Now
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('server-info')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-3"
            >
              <i className="ri-information-line text-xl"></i>
              Server Info
            </Button>
          </div>

          <div className="scroll-reveal max-w-md mx-auto">
            <LiveStats />
          </div>
        </div>
      </div>
      
      <div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleScrollToNext}
        role="button"
        aria-label="Scroll to next section"
      >
        <i className="ri-arrow-down-line text-white text-2xl"></i>
      </div>
    </section>
  );
}

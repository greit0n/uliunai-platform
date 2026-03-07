import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MotionIcon } from 'motion-icons-react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const goToSection = (sectionId: string) => {
    setIsMenuOpen(false);
    if (isHome) {
      const element = document.getElementById(sectionId);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      // After navigation, scroll to section once DOM is ready
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const navLinkClass = "relative text-gray-300 hover:text-red-400 transition-all duration-200 cursor-pointer whitespace-nowrap after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-0.5 after:bg-red-500 after:transition-all after:duration-200 hover:after:w-full";
  const mobileLinkClass = "text-gray-300 hover:text-red-400 transition-colors duration-200 text-left cursor-pointer whitespace-nowrap";

  const sections = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'server-info', label: 'Server Info' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'vip', label: 'VIP' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-red-900/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Hub back link */}
          <div className="flex items-center space-x-3">
            <a
              href="https://uliunai.fezle.io"
              className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center hover:from-red-500 hover:to-red-700 transition-all"
              title="Back to Hub"
            >
              <span className="flicker"><MotionIcon name="Skull" color="white" size={22} animation="shake"  /></span>
            </a>
            <Link to="/" className="text-2xl font-bold text-white font-orbitron hover:opacity-90 transition-opacity">
              <span className="text-red-500">Uliunai</span>.lt
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-8">
            {sections.map(s => (
              <button key={s.id} onClick={() => goToSection(s.id)} className={navLinkClass}>
                {s.label}
              </button>
            ))}
            <Link to="/stats" className={navLinkClass}>
              <i className="ri-bar-chart-grouped-line mr-1"></i>Stats
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white cursor-pointer"
          >
            <i className={`ri-${isMenuOpen ? 'close' : 'menu'}-line text-2xl`}></i>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-red-900/30">
            <div className="flex flex-col space-y-4">
              {sections.map(s => (
                <button key={s.id} onClick={() => goToSection(s.id)} className={mobileLinkClass}>
                  {s.label}
                </button>
              ))}
              <Link to="/stats" onClick={() => setIsMenuOpen(false)} className={mobileLinkClass}>
                <i className="ri-bar-chart-grouped-line mr-1"></i>Stats
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

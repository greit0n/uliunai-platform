import { useState } from 'react';
import { MotionIcon } from 'motion-icons-react';

/**
 * Navigation component providing site-wide navigation with smooth scrolling.
 *
 * @description Displays a fixed navigation bar at the top of the page with links to
 * different sections. Includes a responsive mobile menu that toggles on smaller screens.
 * All navigation links use smooth scrolling to navigate to their respective sections.
 *
 * @returns {JSX.Element} A navigation bar component
 */
export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /**
   * Scrolls to a specific section on the page and closes the mobile menu.
   * 
   * @param {string} sectionId - The ID of the section element to scroll to
   */
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-red-900/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
              <span className="flicker"><MotionIcon name="Skull" color="white" size={22} animation="shake" trigger="hover" interactive /></span>
            </div>
            <h1 className="text-2xl font-bold text-white font-orbitron">
              <span className="text-red-500">Uliunai</span>.lt
            </h1>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('home')}
              className="text-gray-300 hover:text-red-400 hover:shadow-[0_2px_10px_rgba(220,38,38,0.5)] transition-colors cursor-pointer whitespace-nowrap"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="text-gray-300 hover:text-red-400 hover:shadow-[0_2px_10px_rgba(220,38,38,0.5)] transition-colors cursor-pointer whitespace-nowrap"
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection('server-info')}
              className="text-gray-300 hover:text-red-400 hover:shadow-[0_2px_10px_rgba(220,38,38,0.5)] transition-colors cursor-pointer whitespace-nowrap"
            >
              Server Info
            </button>
            <button 
              onClick={() => scrollToSection('gallery')}
              className="text-gray-300 hover:text-red-400 hover:shadow-[0_2px_10px_rgba(220,38,38,0.5)] transition-colors cursor-pointer whitespace-nowrap"
            >
              Gallery
            </button>
            <button 
              onClick={() => scrollToSection('vip')}
              className="text-gray-300 hover:text-red-400 hover:shadow-[0_2px_10px_rgba(220,38,38,0.5)] transition-colors cursor-pointer whitespace-nowrap"
            >
              VIP
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="text-gray-300 hover:text-red-400 hover:shadow-[0_2px_10px_rgba(220,38,38,0.5)] transition-colors cursor-pointer whitespace-nowrap"
            >
              Contact
            </button>
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white cursor-pointer"
          >
            <i className={`ri-${isMenuOpen ? 'close' : 'menu'}-line text-2xl`}></i>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-red-900/30">
            <div className="flex flex-col space-y-4">
              <button 
                onClick={() => scrollToSection('home')}
                className="text-gray-300 hover:text-red-400 transition-colors text-left cursor-pointer whitespace-nowrap"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="text-gray-300 hover:text-red-400 transition-colors text-left cursor-pointer whitespace-nowrap"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('server-info')}
                className="text-gray-300 hover:text-red-400 transition-colors text-left cursor-pointer whitespace-nowrap"
              >
                Server Info
              </button>
              <button 
                onClick={() => scrollToSection('gallery')}
                className="text-gray-300 hover:text-red-400 transition-colors text-left cursor-pointer whitespace-nowrap"
              >
                Gallery
              </button>
              <button 
                onClick={() => scrollToSection('vip')}
                className="text-gray-300 hover:text-red-400 transition-colors text-left cursor-pointer whitespace-nowrap"
              >
                VIP
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="text-gray-300 hover:text-red-400 transition-colors text-left cursor-pointer whitespace-nowrap"
              >
                Contact
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

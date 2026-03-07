import { MotionIcon } from 'motion-icons-react';
import { Link } from 'react-router-dom';

/**
 * Footer component displaying site footer with links and server information.
 *
 * @description Provides footer content including quick navigation links, server
 * information, social media links, and copyright information. Includes smooth
 * scrolling navigation to different sections of the page.
 *
 * @returns {JSX.Element} A footer component
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  /**
   * Scrolls to a specific section on the page using smooth scrolling.
   *
   * @param {string} sectionId - The ID of the section element to scroll to
   */
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="spark-wire relative bg-black/80 border-t border-red-900/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <MotionIcon name="Skull" color="white" size={22} animation="shake"  />
              </div>
              <h3 className="text-2xl font-bold text-white font-orbitron">
                <span className="text-red-500">Uliunai</span>.lt
              </h3>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              The longest-running Killing Floor 1 server with custom content, active community,
              and years of reliable service. Join thousands of players in the ultimate zombie survival experience.
            </p>
            <div className="flex gap-4">
              <button className="w-10 h-10 bg-gray-800 hover:bg-red-600 hover:shadow-red-glow rounded-lg flex items-center justify-center transition-colors cursor-pointer">
                <MotionIcon name="MessageCircle" color="white" size={18} animation="bounce"  />
              </button>
              <button className="w-10 h-10 bg-gray-800 hover:bg-red-600 hover:shadow-red-glow rounded-lg flex items-center justify-center transition-colors cursor-pointer">
                <MotionIcon name="Gamepad2" color="white" size={18} animation="wiggle"  />
              </button>
              <button className="w-10 h-10 bg-gray-800 hover:bg-red-600 hover:shadow-red-glow rounded-lg flex items-center justify-center transition-colors cursor-pointer">
                <MotionIcon name="Youtube" color="white" size={18} animation="bounce"  />
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-4 font-orbitron">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollToSection('home')}
                  className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('server-info')}
                  className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Server Info
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('vip')}
                  className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  VIP Membership
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="text-gray-400 hover:text-red-400 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-4 font-orbitron">Server Info</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <strong className="text-red-400">IP:</strong> 94.130.51.236:7707
              </li>
              <li>
                <strong className="text-red-400">Game:</strong> Killing Floor 1
              </li>
              <li>
                <strong className="text-red-400">Max Players:</strong> 32
              </li>
              <li>
                <strong className="text-red-400">Location:</strong> Lithuania
              </li>
              <li>
                <strong className="text-red-400">Uptime:</strong> 99.9%
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} Uliunai.lt. All rights reserved. Not affiliated with Tripwire Interactive. Designed by Litenweb.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Link to="/privacy" className="text-gray-400 hover:text-red-400 text-sm transition-colors whitespace-nowrap">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-red-400 text-sm transition-colors whitespace-nowrap">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { MotionIcon } from 'motion-icons-react';
import Card from '../../../components/base/Card';
import useScrollReveal from '@/hooks/useScrollReveal';

/**
 * ServerInfoSection component displaying server features and connection information.
 *
 * @description Shows a comprehensive overview of server features including custom content,
 * server details, connection information, and action buttons. Displays live server
 * statistics alongside detailed feature cards.
 *
 * @returns {JSX.Element} The server info section component
 */
export default function ServerInfoSection() {
  const sectionRef = useScrollReveal();
  /**
   * Array of server features with icons, titles, and descriptions.
   *
   * @type {Array<{icon: string, title: string, description: string, animation: string}>}
   */
  const features = [
    {
      icon: 'Swords',
      title: 'Custom Weapons',
      description: 'Unique arsenal with custom weapons not found in vanilla Killing Floor',
      animation: 'shake'
    },
    {
      icon: 'Map',
      title: 'Custom Maps',
      description: 'Exclusive maps designed for enhanced gameplay and new challenges',
      animation: 'bounce'
    },
    {
      icon: 'Skull',
      title: 'Custom Monsters',
      description: 'Face new and terrifying creatures with unique abilities and behaviors',
      animation: 'shake'
    },
    {
      icon: 'Star',
      title: 'Active Admins',
      description: 'Dedicated administrators ensuring fair play and server stability',
      animation: 'spin'
    },
    {
      icon: 'CalendarDays',
      title: 'Regular Events',
      description: 'Weekly tournaments, special events, and community challenges',
      animation: 'bounce'
    },
    {
      icon: 'RefreshCw',
      title: 'Regular Updates',
      description: 'Continuous improvements and new content additions',
      animation: 'spin'
    }
  ];

  return (
    <section id="server-info" ref={sectionRef} className="py-20 bg-gray-900/80">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 scroll-reveal">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-orbitron horror-heading">
            Server <span className="text-red-500">Features</span>
          </h2>
          <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience Killing Floor like never before with our extensive custom content and active community
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="scroll-reveal" style={{ animationDelay: `${(index + 1) * 0.1}s` }}>
              <Card variant="dark" className="text-center hover:scale-[1.02] transition-transform duration-300 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MotionIcon name={feature.icon} color="white" size={28} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-orbitron">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </Card>
            </div>
          ))}
        </div>

        {/* Discord Community Banner */}
        <div className="scroll-reveal">
          <div className="relative overflow-hidden rounded-lg border border-red-900/30 bg-gradient-to-r from-[#5865F2]/20 via-black/60 to-red-900/20 p-8 md:p-12">
            <div className="absolute inset-0 bg-gradient-to-r from-[#5865F2]/10 to-red-600/10 opacity-50"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-[#5865F2] rounded-2xl flex items-center justify-center shadow-lg shadow-[#5865F2]/30 flex-shrink-0">
                  <i className="ri-discord-fill text-white text-3xl"></i>
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white font-orbitron mb-1">
                    Join Our Community
                  </h3>
                  <p className="text-gray-300 text-lg">
                    Chat with players, get server updates, find teammates, and connect with admins
                  </p>
                </div>
              </div>
              <a
                href="https://discord.gg/uliunai"
                target="_blank"
                rel="noopener noreferrer"
                className="pulse-glow flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors whitespace-nowrap shadow-lg shadow-[#5865F2]/25"
              >
                <i className="ri-discord-fill text-xl"></i>
                Join Discord
              </a>
            </div>
            <div className="relative z-10 mt-6 flex flex-wrap gap-6 justify-center md:justify-start text-sm text-gray-400">
              <span className="flex items-center gap-2"><i className="ri-group-line text-[#5865F2]"></i> Active Community</span>
              <span className="flex items-center gap-2"><i className="ri-notification-3-line text-[#5865F2]"></i> Server Announcements</span>
              <span className="flex items-center gap-2"><i className="ri-customer-service-2-line text-[#5865F2]"></i> Admin Support</span>
              <span className="flex items-center gap-2"><i className="ri-calendar-event-line text-[#5865F2]"></i> Event Updates</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

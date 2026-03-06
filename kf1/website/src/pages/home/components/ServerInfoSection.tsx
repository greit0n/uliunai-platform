import { MotionIcon } from 'motion-icons-react';
import Button from '../../../components/base/Button';
import Card from '../../../components/base/Card';
import LiveStats from '../../../components/feature/LiveStats';
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
   * Placeholder handler for viewing player rankings.
   *
   * @description Currently shows an alert indicating the feature is coming soon.
   * In production, this would navigate to a rankings page or open a rankings modal.
   */
  const handleViewRankings = () => {
    alert('Rankings feature coming soon!');
  };

  /**
   * Placeholder handler for viewing online players list.
   *
   * @description Currently shows an alert indicating the feature is coming soon.
   * In production, this would display a list of currently online players.
   */
  const handleViewPlayers = () => {
    alert('Online players list coming soon!');
  };

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
              <Card variant="dark" className="text-center hover:scale-105 transition-transform duration-300 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MotionIcon name={feature.icon} color="white" size={28} animation={feature.animation} trigger="hover" interactive />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-orbitron">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </Card>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <Card variant="blood">
              <h3 className="text-2xl font-bold text-white mb-6 font-orbitron">Server Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-bold text-red-400 mb-3">Connection Details</h4>
                  <div className="space-y-2 text-gray-300">
                    <div><strong>Server IP:</strong> <span className="font-mono text-red-400">51.195.117.236:9980</span></div>
                    <div><strong>Game Version:</strong> Killing Floor v1065</div>
                    <div><strong>Max Players:</strong> 32</div>
                    <div><strong>Difficulty:</strong> HOE / Suicidal / Hard</div>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-red-400 mb-3">Server Features</h4>
                  <div className="space-y-2 text-gray-300">
                    <div>✓ 150 Level Cap</div>
                    <div>✓ +6 Custom Perks</div>
                    <div>✓ Custom Weapons &amp; Maps</div>
                    <div>✓ VIP System Available</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-8">
                <Button variant="primary" onClick={handleJoinServer} className="pulse-glow flex items-center gap-2">
                  <i className="ri-gamepad-fill"></i>
                  Join Server
                </Button>
                <Button variant="outline" onClick={handleViewRankings} className="pulse-glow flex items-center gap-2">
                  <i className="ri-trophy-fill"></i>
                  View Rankings
                </Button>
                <Button variant="outline" onClick={handleViewPlayers} className="pulse-glow flex items-center gap-2">
                  <i className="ri-user-line"></i>
                  Online Players
                </Button>
              </div>
            </Card>
          </div>

          <div>
            <LiveStats />
          </div>
        </div>
      </div>
    </section>
  );
}

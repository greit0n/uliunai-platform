import { MotionIcon } from 'motion-icons-react';
import Card from '../../../components/base/Card';
import useScrollReveal from '@/hooks/useScrollReveal';

/**
 * AdminSection component displaying server administrators and team information.
 *
 * @description Shows profiles of server administrators including their roles,
 * experience, specialties, and contact information. Includes a help section
 * for users needing assistance.
 *
 * @returns {JSX.Element} The admin section component
 */
export default function AdminSection() {
  const sectionRef = useScrollReveal();
  /**
   * Array of administrator profiles.
   *
   * @type {Array<{name: string, role: string, badge: string, description: string, specialties: string[]}>}
   */
  const admins = [
    {
      name: 'Lytair',
      role: 'Head Administrator',
      badge: 'Founder',
      description: 'Leading the Uliunai.lt community and keeping the server running smoothly for all players. Responsible for overall server management, community moderation, and ensuring a fair gaming environment.',
      specialties: ['Server Management', 'Community Moderation', 'Player Support']
    },
    {
      name: 'HekuT',
      role: 'Server Technician',
      badge: 'Core Team',
      description: 'The technical backbone of Uliunai.lt. Handles server configuration, ServerPerks setup, custom content integration, and keeps everything running at peak performance.',
      specialties: ['Server Configuration', 'ServerPerks', 'Custom Content']
    },
    {
      name: 'Greiton',
      role: 'Website Administrator',
      badge: 'Core Team',
      description: 'Designed and built the Uliunai.lt platform from the ground up. Responsible for the website, statistics pages, and all web-related infrastructure.',
      specialties: ['Web Development', 'Platform Design', 'Statistics']
    }
  ];

  return (
    <section id="team" ref={sectionRef} className="py-20 bg-black/80">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 scroll-reveal">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-orbitron horror-heading">
            Meet Our <span className="text-red-500">Team</span>
          </h2>
          <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our dedicated administrators work around the clock to ensure the best gaming experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {admins.map((admin, index) => (
            <div key={index} className="scroll-reveal" style={{ animationDelay: `${(index + 1) * 0.1}s` }}>
            <Card variant="blood" className="text-center hover:scale-[1.02] transition-transform duration-300 h-full flex flex-col">
              <div className="relative mb-6">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-red-600 shadow-lg shadow-red-600/25 bg-gray-800 flex items-center justify-center">
                  <i className="ri-user-fill text-5xl text-gray-500"></i>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {admin.badge}
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 font-orbitron">{admin.name}</h3>
              <p className="text-red-400 font-semibold mb-4">{admin.role}</p>

              <p className="text-gray-300 mb-6 leading-relaxed flex-1">{admin.description}</p>

              <div className="mb-6">
                <h4 className="text-lg font-bold text-white mb-3 font-orbitron">Specialties</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {admin.specialties.map((specialty, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-800 text-red-400 px-3 py-1 rounded-full text-sm border border-red-900/30"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button className="w-10 h-10 bg-gray-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors cursor-pointer">
                  <MotionIcon name="Gamepad2" color="white" size={18} animation="wiggle"  />
                </button>
                <button className="w-10 h-10 bg-gray-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors cursor-pointer">
                  <MotionIcon name="MessageCircle" color="white" size={18} animation="bounce"  />
                </button>
              </div>
            </Card>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Card variant="dark" className="inline-block">
            <div className="flex items-center gap-4">
              <MotionIcon name="Headphones" color="#f87171" size={30} animation="bounce"  />
              <div>
                <h3 className="text-xl font-bold text-white font-orbitron">Need Help?</h3>
                <p className="text-gray-300">Our admins are available 24/7 to assist you</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

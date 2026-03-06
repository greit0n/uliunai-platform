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
   * @type {Array<{name: string, role: string, avatar: string, description: string, experience: string, specialties: string[]}>}
   */
  const admins = [
    {
      name: 'Lytair',
      role: 'Head Administrator',
      avatar: 'https://readdy.ai/api/search-image?query=professional%20gaming%20administrator%20portrait%20with%20dark%20background%2C%20serious%20expression%2C%20wearing%20gaming%20headset%2C%20red%20accent%20lighting%2C%20cyberpunk%20style%20character%20design%20for%20gaming%20community%20leader&width=400&height=400&seq=admin-lytair&orientation=squarish',
      description: 'Leading the Uliunai.lt community and keeping the server running smoothly for all players. Responsible for overall server management, community moderation, and ensuring a fair gaming environment.',
      experience: '9+ Years',
      specialties: ['Server Management', 'Community Moderation', 'Player Support']
    },
    {
      name: 'HekuT',
      role: 'Server Technician',
      avatar: 'https://readdy.ai/api/search-image?query=gaming%20administrator%20portrait%20with%20dark%20atmospheric%20background%2C%20confident%20pose%2C%20red%20and%20black%20color%20scheme%2C%20professional%20gaming%20community%20moderator%20character%20design%20with%20tech%20elements&width=400&height=400&seq=admin-hekut&orientation=squarish',
      description: 'The technical backbone of Uliunai.lt. Handles server configuration, ServerPerks setup, custom content integration, and keeps everything running at peak performance.',
      experience: '9+ Years',
      specialties: ['Server Configuration', 'ServerPerks', 'Custom Content']
    },
    {
      name: 'Greiton',
      role: 'Website Administrator',
      avatar: 'https://readdy.ai/api/search-image?query=web%20developer%20portrait%20with%20dark%20atmospheric%20background%2C%20tech%20style%2C%20red%20and%20black%20color%20scheme%2C%20professional%20gaming%20community%20web%20developer%20character%20design&width=400&height=400&seq=admin-greiton&orientation=squarish',
      description: 'Designed and built the Uliunai.lt platform from the ground up. Responsible for the website, statistics pages, and all web-related infrastructure.',
      experience: '9+ Years',
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
            <Card variant="blood" className="text-center hover:scale-105 transition-transform duration-300">
              <div className="relative mb-6">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-red-600 shadow-lg shadow-red-600/25">
                  <img
                    src={admin.avatar}
                    alt={admin.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {admin.experience}
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 font-orbitron">{admin.name}</h3>
              <p className="text-red-400 font-semibold mb-4">{admin.role}</p>

              <p className="text-gray-300 mb-6 leading-relaxed">{admin.description}</p>

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
                  <MotionIcon name="Gamepad2" color="white" size={18} animation="wiggle" trigger="hover" interactive />
                </button>
                <button className="w-10 h-10 bg-gray-800 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors cursor-pointer">
                  <MotionIcon name="MessageCircle" color="white" size={18} animation="bounce" trigger="hover" interactive />
                </button>
              </div>
            </Card>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Card variant="dark" className="inline-block">
            <div className="flex items-center gap-4">
              <MotionIcon name="Headphones" color="#f87171" size={30} animation="bounce" trigger="hover" interactive />
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

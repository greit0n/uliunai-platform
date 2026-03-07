import { MotionIcon } from 'motion-icons-react';
import Card from '../../../components/base/Card';
import useScrollReveal from '@/hooks/useScrollReveal';

/**
 * AboutSection component displaying information about the server and community.
 *
 * @description Presents the server's history, community values, and key statistics.
 * Includes information about years of service, player count, uptime, and community
 * features like active community, fair play, and continued support.
 *
 * @returns {JSX.Element} The about section component
 */
export default function AboutSection() {
  const sectionRef = useScrollReveal();

  return (
    <section id="about" ref={sectionRef} className="py-20 bg-gradient-to-b from-black/80 to-gray-900/80">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 scroll-reveal">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-orbitron horror-heading">
            About <span className="text-red-500">Our Community</span>
          </h2>
          <div className="w-24 h-1 bg-red-600 mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="scroll-reveal" style={{ animationDelay: '0.1s' }}>
            <Card variant="dark" className="hover:scale-[1.02] transition-transform duration-300">
              <h3 className="text-2xl font-bold text-white mb-6 font-orbitron">Years of Excellence</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Uliunai.lt has been serving the Killing Floor community since <strong className="text-red-400">2017</strong>,
                making us one of the most established and trusted servers in the game. Our dedication to providing
                an exceptional gaming experience has earned us a loyal following of players from around the world.
              </p>
              <p className="text-gray-300 mb-6 leading-relaxed">
                What sets us apart is our <strong className="text-red-400">friendly and welcoming community</strong>.
                Whether you're a seasoned veteran or new to Killing Floor, you'll find helpful players and active
                admins ready to assist and ensure everyone has a great time.
              </p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400 font-orbitron">9+</div>
                  <div className="text-sm text-gray-400">Years Active</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400 font-orbitron">10K+</div>
                  <div className="text-sm text-gray-400">Players Served</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400 font-orbitron">24/7</div>
                  <div className="text-sm text-gray-400">Uptime</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="scroll-reveal" style={{ animationDelay: '0.2s' }}>
              <Card variant="blood" className="hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-4">
                    <MotionIcon name="Users" color="white" size={22} />
                  </div>
                  <h4 className="text-xl font-bold text-white font-orbitron">Active Community</h4>
                </div>
                <p className="text-gray-300">
                  Our server maintains an active player base with regular events, tournaments, and community challenges
                  that keep the gameplay fresh and exciting.
                </p>
              </Card>
            </div>

            <div className="scroll-reveal" style={{ animationDelay: '0.3s' }}>
              <Card variant="blood" className="hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-4">
                    <MotionIcon name="ShieldCheck" color="white" size={22} />
                  </div>
                  <h4 className="text-xl font-bold text-white font-orbitron">Fair Play</h4>
                </div>
                <p className="text-gray-300">
                  We maintain a clean, fair gaming environment with active moderation and anti-cheat measures
                  to ensure everyone can enjoy the game as intended.
                </p>
              </Card>
            </div>

            <div className="scroll-reveal" style={{ animationDelay: '0.4s' }}>
              <Card variant="blood" className="hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-4">
                    <MotionIcon name="Heart" color="white" size={22} />
                  </div>
                  <h4 className="text-xl font-bold text-white font-orbitron">Still Alive & Thriving</h4>
                </div>
                <p className="text-gray-300">
                  While many servers have come and gone, Uliunai.lt continues to thrive with regular updates,
                  new content, and a passionate community that keeps the spirit of Killing Floor alive.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

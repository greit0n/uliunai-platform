import Card from '../../../components/base/Card';

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
  return (
    <section id="about" className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-orbitron">
            About <span className="text-red-500">Our Community</span>
          </h2>
          <div className="w-24 h-1 bg-red-600 mx-auto"></div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Card variant="dark">
              <h3 className="text-2xl font-bold text-white mb-6 font-orbitron">Years of Excellence</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Uliunai.lt has been serving the Killing Floor community for over <strong className="text-red-400">8 years</strong>, 
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
                  <div className="text-3xl font-bold text-red-400 font-orbitron">8+</div>
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
            <Card variant="blood">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-4">
                  <i className="ri-team-fill text-white text-xl"></i>
                </div>
                <h4 className="text-xl font-bold text-white font-orbitron">Active Community</h4>
              </div>
              <p className="text-gray-300">
                Our server maintains an active player base with regular events, tournaments, and community challenges 
                that keep the gameplay fresh and exciting.
              </p>
            </Card>
            
            <Card variant="blood">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-4">
                  <i className="ri-shield-check-fill text-white text-xl"></i>
                </div>
                <h4 className="text-xl font-bold text-white font-orbitron">Fair Play</h4>
              </div>
              <p className="text-gray-300">
                We maintain a clean, fair gaming environment with active moderation and anti-cheat measures 
                to ensure everyone can enjoy the game as intended.
              </p>
            </Card>
            
            <Card variant="blood">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-4">
                  <i className="ri-heart-fill text-white text-xl"></i>
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
    </section>
  );
}

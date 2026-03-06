import Card from '../../../components/base/Card';
import useScrollReveal from '@/hooks/useScrollReveal';

/**
 * NewsSection component displaying latest server news and announcements.
 *
 * @description Shows a grid of news items with different types (event, update,
 * maintenance, tournament) each with distinct icons and colors. Includes a
 * call-to-action for joining the Discord community.
 *
 * @returns {JSX.Element} The news section component
 */
export default function NewsSection() {
  const sectionRef = useScrollReveal();
  /**
   * Array of news items to display.
   * 
   * @type {Array<{date: string, title: string, content: string, type: string}>}
   */
  const news = [
    {
      date: '2026-03-01',
      title: 'New Website Launched!',
      content: 'Welcome to the brand new Uliunai.lt website! Explore server info, community features, and more. Stay tuned for upcoming statistics and VIP pages.',
      type: 'update'
    },
    {
      date: '2026-02-15',
      title: 'Server Upgraded to v1065',
      content: 'Our server has been updated with the latest version, including improved stability, +6 custom perks, and a 150 level cap.',
      type: 'maintenance'
    },
    {
      date: '2026-02-01',
      title: '9 Years of Uliunai.lt!',
      content: 'We\'re celebrating 9 years of serving the Killing Floor community! Thank you to all our players for keeping the spirit alive.',
      type: 'event'
    },
    {
      date: '2026-01-20',
      title: 'VIP System Coming Soon',
      content: 'We\'re working on a new VIP system with exclusive perks and rewards. Details and pricing will be announced soon.',
      type: 'update'
    }
  ];

  /**
   * Returns the appropriate icon class for a news item type.
   * 
   * @param {string} type - The news item type (event, update, maintenance, tournament)
   * @returns {string} The RemixIcon class name for the type
   */
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event': return 'ri-calendar-event-fill';
      case 'update': return 'ri-download-fill';
      case 'maintenance': return 'ri-tools-fill';
      case 'tournament': return 'ri-trophy-fill';
      default: return 'ri-information-fill';
    }
  };

  /**
   * Returns the appropriate text color class for a news item type.
   * 
   * @param {string} type - The news item type (event, update, maintenance, tournament)
   * @returns {string} The Tailwind CSS text color class for the type
   */
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'event': return 'text-yellow-400';
      case 'update': return 'text-blue-400';
      case 'maintenance': return 'text-green-400';
      case 'tournament': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <section id="news" ref={sectionRef} className="py-20 bg-gradient-to-b from-gray-900/80 to-black/80">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 scroll-reveal">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-orbitron horror-heading">
            Latest <span className="text-red-500">News</span>
          </h2>
          <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Stay updated with the latest server news, events, and announcements
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {news.map((item, index) => (
            <div key={index} className="scroll-reveal" style={{ animationDelay: `${(index + 1) * 0.1}s` }}>
              <Card variant="dark" className="hover:scale-105 transition-transform duration-300 h-full">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className={`${getTypeIcon(item.type)} ${getTypeColor(item.type)} text-xl`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-400">{item.date}</span>
                      <span className={`text-xs px-2 py-1 rounded-full bg-gray-800 ${getTypeColor(item.type)} capitalize`}>
                        {item.type}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 font-orbitron">{item.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{item.content}</p>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Card variant="blood" className="inline-block">
            <div className="flex items-center gap-4">
              <i className="ri-notification-fill text-red-400 text-2xl"></i>
              <div>
                <h3 className="text-lg font-bold text-white font-orbitron">Stay Connected</h3>
                <p className="text-gray-300">Join our Discord for real-time updates and community chat</p>
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
                Join Discord
              </button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

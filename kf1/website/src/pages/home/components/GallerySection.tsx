import { useState } from 'react';
import Card from '../../../components/base/Card';
import useScrollReveal from '@/hooks/useScrollReveal';

/**
 * GallerySection component displaying game screenshots and media gallery.
 *
 * @description Shows a grid of game screenshots and media items with a lightbox
 * modal for viewing full-size images. Includes placeholder sections for video
 * content and server highlights.
 *
 * @returns {JSX.Element} The gallery section component
 */
export default function GallerySection() {
  const sectionRef = useScrollReveal();
  /**
   * Currently selected media item for lightbox display.
   * 
   * @type {string | null}
   */
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);

  /**
   * Array of media items to display in the gallery.
   * 
   * @type {Array<{type: string, src: string, title: string}>}
   */
  const mediaItems = [
    {
      type: 'image',
      src: 'https://readdy.ai/api/search-image?query=Killing%20Floor%201%20gameplay%20screenshot%20showing%20players%20fighting%20zombies%20with%20custom%20weapons%20in%20dark%20industrial%20laboratory%20setting%2C%20blood%20effects%20and%20muzzle%20flashes%2C%20team%20cooperation%20against%20specimen%20horde&width=800&height=600&seq=gallery-1&orientation=landscape',
      title: 'Epic Team Battle'
    },
    {
      type: 'image',
      src: 'https://readdy.ai/api/search-image?query=Killing%20Floor%201%20custom%20map%20screenshot%20featuring%20unique%20architecture%20with%20red%20emergency%20lighting%2C%20metal%20corridors%20and%20industrial%20machinery%2C%20atmospheric%20horror%20environment%20with%20detailed%20textures&width=800&height=600&seq=gallery-2&orientation=landscape',
      title: 'Custom Map: Industrial Complex'
    },
    {
      type: 'image',
      src: 'https://readdy.ai/api/search-image?query=Killing%20Floor%201%20boss%20fight%20scene%20with%20Patriarch%20final%20boss%2C%20players%20using%20various%20weapons%20including%20custom%20firearms%2C%20dramatic%20lighting%20and%20particle%20effects%2C%20intense%20combat%20atmosphere&width=800&height=600&seq=gallery-3&orientation=landscape',
      title: 'Boss Fight: The Patriarch'
    },
    {
      type: 'image',
      src: 'https://readdy.ai/api/search-image?query=Killing%20Floor%201%20weapon%20showcase%20displaying%20custom%20firearms%20and%20melee%20weapons%20on%20dark%20background%2C%20detailed%20weapon%20models%20with%20blood%20stains%20and%20battle%20damage%2C%20arsenal%20collection&width=800&height=600&seq=gallery-4&orientation=landscape',
      title: 'Custom Weapons Arsenal'
    },
    {
      type: 'image',
      src: 'https://readdy.ai/api/search-image?query=Killing%20Floor%201%20multiplayer%20lobby%20showing%20player%20characters%20in%20different%20perks%20and%20outfits%2C%20team%20preparation%20before%20wave%20start%2C%20character%20customization%20and%20equipment%20selection&width=800&height=600&seq=gallery-5&orientation=landscape',
      title: 'Community Players'
    },
    {
      type: 'image',
      src: 'https://readdy.ai/api/search-image?query=Killing%20Floor%201%20specimen%20showcase%20featuring%20various%20zombie%20types%20and%20mutants%2C%20detailed%20creature%20designs%20with%20gore%20effects%2C%20monster%20variety%20in%20dark%20horror%20setting&width=800&height=600&seq=gallery-6&orientation=landscape',
      title: 'Custom Specimens'
    }
  ];

  return (
    <section id="gallery" ref={sectionRef} className="py-20 bg-black/80">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 scroll-reveal">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-orbitron horror-heading">
            Game <span className="text-red-500">Gallery</span>
          </h2>
          <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Take a look at the intense action and custom content that awaits you on our server
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaItems.map((item, index) => (
            <div key={index} className="scroll-reveal" style={{ animationDelay: `${(index + 1) * 0.1}s` }} onClick={() => setSelectedMedia(item.src)}>
              <Card
                variant="dark"
                className="vhs-overlay overflow-hidden hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
              >
                <div className="relative group">
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-full h-48 object-cover object-top rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-lg">
                    <i className="ri-eye-fill text-white text-3xl"></i>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mt-4 font-orbitron">{item.title}</h3>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <h3 className="text-3xl font-bold text-white text-center mb-8 font-orbitron">
            Server <span className="text-red-500">Highlights</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <Card variant="blood">
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <i className="ri-play-circle-fill text-red-500 text-6xl mb-4"></i>
                  <p className="text-white font-orbitron">Server Trailer</p>
                  <p className="text-gray-400 text-sm">Epic moments compilation</p>
                </div>
              </div>
            </Card>
            <Card variant="blood">
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <i className="ri-play-circle-fill text-red-500 text-6xl mb-4"></i>
                  <p className="text-white font-orbitron">Custom Content Showcase</p>
                  <p className="text-gray-400 text-sm">New weapons and maps</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {selectedMedia && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMedia(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <img 
                src={selectedMedia}
                alt="Gallery item"
                className="max-w-full max-h-full object-contain"
              />
              <button 
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4 text-white text-3xl hover:text-red-400 transition-colors cursor-pointer"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

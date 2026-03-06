import { MotionIcon } from 'motion-icons-react';
import Button from '../../../components/base/Button';
import Card from '../../../components/base/Card';
import useScrollReveal from '@/hooks/useScrollReveal';

/**
 * VipSection component displaying VIP membership tiers and benefits.
 *
 * @description Shows available VIP membership options with pricing, benefits,
 * and purchase buttons. Includes information about why supporting the server
 * is important and payment options.
 *
 * @returns {JSX.Element} The VIP section component
 */
export default function VipSection() {
  const sectionRef = useScrollReveal();
  /**
   * Array of VIP tier configurations.
   *
   * @type {Array<{name: string, price: string, period: string, multiplier: string, color: string, features: string[], popular: boolean}>}
   */
  const vipTiers = [
    {
      name: 'VIP',
      price: '€4.99',
      period: '/month',
      multiplier: '2x',
      color: 'from-yellow-600 to-yellow-800',
      features: [
        'Double Experience (2x XP)',
        'Priority Server Access',
        'VIP Chat Color',
        'Reserved Slot',
        'Special VIP Badge',
        'Access to VIP-Only Events'
      ],
      popular: false
    },
    {
      name: 'VIP+',
      price: '€9.99',
      period: '/month',
      multiplier: '3x',
      color: 'from-red-600 to-red-800',
      features: [
        'Triple Experience (3x XP)',
        'All VIP Benefits',
        'Exclusive VIP+ Weapons',
        'Custom Player Model',
        'VIP+ Chat Commands',
        'Early Access to New Content',
        'Personal Admin Support',
        'Monthly Bonus Rewards'
      ],
      popular: true
    }
  ];

  /**
   * Handles VIP tier purchase action.
   *
   * @param {string} tier - The VIP tier name to purchase (VIP or VIP+)
   * @description Currently shows an alert indicating the purchase feature is coming soon.
   * In production, this would redirect to a payment processor or open a purchase modal.
   */
  const handleBuyVip = (tier: string) => {
    alert(`${tier} purchase coming soon! Contact admins for now.`);
  };

  return (
    <section id="vip" ref={sectionRef} className="py-20 bg-gradient-to-b from-gray-900/80 to-black/80">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 scroll-reveal">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-orbitron horror-heading">
            Support Our <span className="text-red-500">Server</span>
          </h2>
          <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Help keep our server running and get exclusive benefits with our VIP membership tiers
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {vipTiers.map((tier, index) => (
            <div key={index} className="scroll-reveal" style={{ animationDelay: `${(index + 1) * 0.1}s` }}>
            <Card
              variant="dark"
              className={`relative overflow-hidden ${tier.popular ? 'ring-2 ring-red-500 scale-105' : ''}`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-2 font-bold text-sm">
                  MOST POPULAR
                </div>
              )}

              <div className={`text-center ${tier.popular ? 'pt-8' : ''}`}>
                <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4`}>
                  <span className="text-2xl font-bold text-white font-orbitron">{tier.multiplier}</span>
                </div>

                <h3 className="text-3xl font-bold text-white mb-2 font-orbitron">{tier.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-red-400">{tier.price}</span>
                  <span className="text-gray-400">{tier.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-300">
                      <i className="ri-check-fill text-green-400 mr-3"></i>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={tier.popular ? 'primary' : 'outline'}
                  size="lg"
                  onClick={() => handleBuyVip(tier.name)}
                  className="pulse-glow w-full"
                >
                  Buy {tier.name}
                </Button>
              </div>
            </Card>
            </div>
          ))}
        </div>

        <div className="text-center mb-12">
          <Card variant="blood" className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6 font-orbitron">Why Support Us?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <MotionIcon name="Server" color="#f87171" size={30} animation="pulse" trigger="hover" interactive />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Server Costs</h4>
                <p className="text-gray-300 text-sm">Help us maintain high-performance servers and reliable uptime</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <MotionIcon name="Code" color="#f87171" size={30} animation="bounce" trigger="hover" interactive />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Development</h4>
                <p className="text-gray-300 text-sm">Fund continued development of custom content and features</p>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <MotionIcon name="Users" color="#f87171" size={30} animation="bounce" trigger="hover" interactive />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Community</h4>
                <p className="text-gray-300 text-sm">Support events, tournaments, and community activities</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-gray-400 mb-4">
            All donations go directly to server maintenance and improvement
          </p>
          <div className="flex justify-center gap-4">
            <button className="pulse-glow flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-paypal-fill text-blue-400"></i>
              PayPal
            </button>
            <button className="pulse-glow flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-bank-card-fill text-green-400"></i>
              Credit Card
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

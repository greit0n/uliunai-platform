import { useState } from 'react';
import { MotionIcon } from 'motion-icons-react';
import Button from '../../../components/base/Button';
import Card from '../../../components/base/Card';
import useScrollReveal from '@/hooks/useScrollReveal';

/**
 * ContactSection component providing contact form and support information.
 *
 * @description Displays a contact form for users to send messages, along with
 * contact information including Discord, Steam, and server connection details.
 * Includes form validation and submission handling.
 *
 * @returns {JSX.Element} The contact section component
 */
export default function ContactSection() {
  const sectionRef = useScrollReveal();
  /**
   * Form data state containing user input values.
   *
   * @type {{name: string, email: string, subject: string, message: string}}
   */
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  /**
   * Loading state indicating if the form is currently being submitted.
   *
   * @type {boolean}
   */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Form submission status state.
   *
   * @type {'idle' | 'success' | 'error'}
   */
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  /**
   * Handles input field changes and updates form data state.
   *
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} e - The change event
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handles form submission with validation and API call.
   *
   * @param {React.FormEvent} e - The form submit event
   * @description Validates message length, submits form data to the server,
   * and updates submission status. Resets form on successful submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.message.length > 500) {
      alert('Message must be 500 characters or less');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('message', formData.message);

      const response = await fetch('FORM_URL_PLACEHOLDER', {
        method: 'POST',
        body: new URLSearchParams(formDataToSend as any)
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" ref={sectionRef} className="py-20 bg-black/80">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 scroll-reveal">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-orbitron horror-heading">
            Get In <span className="text-red-500">Touch</span>
          </h2>
          <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Have questions, suggestions, or need support? We're here to help!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="scroll-reveal" style={{ animationDelay: '0.1s' }}>
          <Card variant="dark">
            <h3 className="text-2xl font-bold text-white mb-6 font-orbitron">Send us a Message</h3>
            <form id="contact-form" data-readdy-form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 pr-8 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="vip">VIP Membership</option>
                  <option value="report">Report Player</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Message * (Max 500 characters)
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  maxLength={500}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500 transition-colors resize-none"
                  placeholder="Your message here..."
                ></textarea>
                <div className="text-right text-xs text-gray-400 mt-1">
                  {formData.message.length}/500 characters
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="pulse-glow w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-fill mr-2"></i>
                    Send Message
                  </>
                )}
              </Button>

              {submitStatus === 'success' && (
                <div className="text-green-400 text-center">
                  <i className="ri-check-circle-fill mr-2"></i>
                  Message sent successfully!
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="text-red-400 text-center">
                  <i className="ri-error-warning-fill mr-2"></i>
                  Failed to send message. Please try again.
                </div>
              )}
            </form>
          </Card>
          </div>

          <div className="space-y-8">
            <div className="scroll-reveal" style={{ animationDelay: '0.2s' }}>
            <Card variant="blood">
              <h3 className="text-2xl font-bold text-white mb-6 font-orbitron">Connect With Us</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <MotionIcon name="MessageCircle" color="white" size={22} animation="bounce" trigger="hover" interactive />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Discord Server</h4>
                    <p className="text-gray-300">Join our community chat</p>
                    <button className="text-red-400 hover:text-red-300 transition-colors cursor-pointer whitespace-nowrap">
                      discord.gg/uliunai
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <MotionIcon name="Gamepad2" color="white" size={22} animation="wiggle" trigger="hover" interactive />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Steam Group</h4>
                    <p className="text-gray-300">Follow for updates</p>
                    <button className="text-red-400 hover:text-red-300 transition-colors cursor-pointer whitespace-nowrap">
                      steamcommunity.com/groups/uliunailt
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <MotionIcon name="Monitor" color="white" size={22} animation="pulse" trigger="hover" interactive />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Game Server</h4>
                    <p className="text-gray-300">Direct connect</p>
                    <button className="text-red-400 hover:text-red-300 transition-colors cursor-pointer whitespace-nowrap font-mono">
                      51.195.117.236:9980
                    </button>
                  </div>
                </div>
              </div>
            </Card>
            </div>

            <div className="scroll-reveal" style={{ animationDelay: '0.3s' }}>
            <Card variant="dark">
              <h3 className="text-xl font-bold text-white mb-4 font-orbitron">Quick Support</h3>
              <p className="text-gray-300 mb-4">
                For immediate assistance, join our Discord server where our admins are most active.
              </p>
              <div className="text-sm text-gray-400">
                <p><strong>Response Time:</strong> Usually within 1-2 hours</p>
                <p><strong>Support Hours:</strong> 24/7 via Discord</p>
              </div>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

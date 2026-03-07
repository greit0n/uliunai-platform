import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-gray-300 relative z-10">
      {/* Top bar with back link */}
      <div className="bg-black/90 border-b border-red-900/30 py-4">
        <div className="container mx-auto px-4">
          <Link to="/" className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-2">
            <i className="ri-arrow-left-line"></i>
            Back to Home
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-2 font-orbitron">
          Privacy <span className="text-red-500">Policy</span>
        </h1>
        <p className="text-gray-500 mb-12">Last updated: March 2026</p>

        {/* Introduction */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Introduction</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            Welcome to Uliunai.lt ("we," "our," or "us"), a community-operated platform dedicated to the
            Killing Floor 1 gaming community. This Privacy Policy explains how we collect, use, store, and
            protect your personal information when you visit our website, use our services, or connect to
            our game servers. We are committed to respecting your privacy and handling your data responsibly.
          </p>
          <p className="text-gray-300 mb-4 leading-relaxed">
            By accessing or using our website and services, you acknowledge that you have read and understood
            this Privacy Policy. If you do not agree with our practices, please discontinue use of our
            services.
          </p>
        </section>

        {/* Data We Collect */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Data We Collect</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            We collect a limited amount of data necessary to operate our services and maintain the community.
            The types of data we collect include:
          </p>

          <h3 className="text-lg font-semibold text-white mb-2">Contact Form Submissions</h3>
          <p className="text-gray-300 mb-4 leading-relaxed">
            When you submit a message through our contact form, we collect the following information that you
            voluntarily provide:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-400">
            <li>Your name</li>
            <li>Your email address</li>
            <li>The subject of your message</li>
            <li>The content of your message</li>
          </ul>

          <h3 className="text-lg font-semibold text-white mb-2">Game Server Statistics</h3>
          <p className="text-gray-300 mb-4 leading-relaxed">
            When you play on our Killing Floor 1 game server, we automatically collect gameplay data,
            including but not limited to:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-400">
            <li>Your in-game player name</li>
            <li>Your Steam ID (as provided by the game engine)</li>
            <li>Gameplay statistics such as kills, deaths, perk levels, and wave progress</li>
            <li>Connection metadata such as ping and session duration</li>
            <li>Your IP address (for server administration and anti-cheat purposes)</li>
          </ul>
          <p className="text-gray-300 mb-4 leading-relaxed">
            This data is collected through our custom server-side mutator (UliunaiStats) which exports
            live game state for the purpose of displaying real-time and historical statistics on our website.
          </p>
        </section>

        {/* How We Use Your Data */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">How We Use Your Data</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            The data we collect is used solely for the following purposes:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-400">
            <li>
              <strong className="text-gray-200">Server Operation:</strong> Maintaining, monitoring, and
              improving the performance and stability of our game servers.
            </li>
            <li>
              <strong className="text-gray-200">Responding to Inquiries:</strong> Replying to your contact
              form submissions, questions, and support requests.
            </li>
            <li>
              <strong className="text-gray-200">Community Management:</strong> Enforcing server rules,
              resolving disputes between players, and preventing cheating or abusive behavior.
            </li>
            <li>
              <strong className="text-gray-200">Statistics and Leaderboards:</strong> Displaying player
              statistics, rankings, and match history on our website for the benefit of the community.
            </li>
            <li>
              <strong className="text-gray-200">Service Improvement:</strong> Analyzing aggregated,
              non-identifiable usage patterns to improve our website and server experience.
            </li>
          </ul>
          <p className="text-gray-300 mb-4 leading-relaxed">
            We do not sell, trade, or rent your personal information to any third parties. We do not use
            your data for advertising or marketing purposes beyond communications directly related to our
            community services.
          </p>
        </section>

        {/* Cookies */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Cookies</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            Our website uses only essential cookies that are strictly necessary for the proper functioning
            of the site. We do not use any tracking cookies, analytics cookies, or advertising cookies.
          </p>
          <p className="text-gray-300 mb-4 leading-relaxed">
            Essential cookies may include session identifiers required for authentication to the server
            administration panel. These cookies are temporary and are deleted when you close your browser
            or log out.
          </p>
          <p className="text-gray-300 mb-4 leading-relaxed">
            We do not use any third-party analytics services such as Google Analytics, Facebook Pixel,
            or similar tracking technologies on our website.
          </p>
        </section>

        {/* Third-Party Services */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Third-Party Services</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            Our website may contain links to third-party services, including but not limited to:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-400">
            <li>
              <strong className="text-gray-200">Steam:</strong> Links to Steam profiles, the Steam store
              page for Killing Floor, and Steam community resources. Steam is operated by Valve Corporation
              and is subject to its own privacy policy.
            </li>
            <li>
              <strong className="text-gray-200">Discord:</strong> Links to our community Discord server.
              Discord is operated by Discord Inc. and is subject to its own privacy policy.
            </li>
            <li>
              <strong className="text-gray-200">Google Fonts:</strong> We load fonts (Orbitron and Rajdhani)
              from Google's CDN. Google may collect limited technical data such as your IP address when
              serving these font files.
            </li>
          </ul>
          <p className="text-gray-300 mb-4 leading-relaxed">
            We are not responsible for the privacy practices or content of these third-party services.
            We encourage you to review their respective privacy policies before interacting with them.
          </p>
        </section>

        {/* Data Retention */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Data Retention</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            We retain your data for the following periods:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-400">
            <li>
              <strong className="text-gray-200">Contact Form Data:</strong> Retained for as long as
              necessary to resolve your inquiry or provide ongoing support. After your inquiry is resolved,
              data may be kept for a reasonable period for reference in case of follow-up questions.
            </li>
            <li>
              <strong className="text-gray-200">Game Statistics:</strong> Retained indefinitely as part
              of the community's historical record, including leaderboards, player rankings, and match
              histories. This data forms part of the community's shared history and is considered valuable
              to all participants.
            </li>
            <li>
              <strong className="text-gray-200">Server Logs and IP Addresses:</strong> IP addresses
              collected for server administration purposes (such as enforcing bans) are retained for as
              long as the associated administrative action is in effect.
            </li>
          </ul>
          <p className="text-gray-300 mb-4 leading-relaxed">
            If you wish to request deletion of your personal data, please contact us using the methods
            described in the Contact section below. Please note that we may not be able to delete aggregated
            or anonymized game statistics that have already been incorporated into community leaderboards.
          </p>
        </section>

        {/* Data Security */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Data Security</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            We take reasonable measures to protect your data from unauthorized access, alteration,
            disclosure, or destruction. Our website is served over HTTPS with SSL/TLS encryption provided
            by Cloudflare. Server access is restricted to authorized administrators only.
          </p>
          <p className="text-gray-300 mb-4 leading-relaxed">
            However, no method of transmission over the Internet or electronic storage is completely secure.
            While we strive to use commercially acceptable means to protect your personal information, we
            cannot guarantee its absolute security.
          </p>
        </section>

        {/* Children's Privacy */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Children's Privacy</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            Our services are not directed at children under the age of 13. Killing Floor is a mature-rated
            game, and our community platform is intended for players who meet the age requirements to play
            the game. We do not knowingly collect personal information from children under 13.
          </p>
          <p className="text-gray-300 mb-4 leading-relaxed">
            If we become aware that we have inadvertently collected personal information from a child under
            13, we will take steps to delete such information as soon as possible. If you believe that a
            child under 13 has provided us with personal information, please contact us immediately.
          </p>
        </section>

        {/* Your Rights */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Your Rights</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            Depending on your jurisdiction, you may have the following rights regarding your personal data:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-400">
            <li>The right to access the personal data we hold about you</li>
            <li>The right to request correction of inaccurate personal data</li>
            <li>The right to request deletion of your personal data, subject to our legitimate interests
              and legal obligations</li>
            <li>The right to object to or restrict the processing of your personal data</li>
            <li>The right to data portability where applicable</li>
          </ul>
          <p className="text-gray-300 mb-4 leading-relaxed">
            To exercise any of these rights, please contact us using the methods described below. We will
            respond to your request within a reasonable timeframe.
          </p>
        </section>

        {/* Changes to This Policy */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Changes to This Policy</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices,
            services, or applicable laws. When we make changes, we will update the "Last updated" date at
            the top of this page.
          </p>
          <p className="text-gray-300 mb-4 leading-relaxed">
            We encourage you to review this Privacy Policy periodically to stay informed about how we
            protect your information. Your continued use of our website and services after any changes to
            this policy constitutes your acceptance of the updated terms.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Contact Us</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle
            your personal data, you can reach us through the following channels:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-400">
            <li>
              <strong className="text-gray-200">Discord:</strong> Join our community Discord server and
              contact an administrator directly.
            </li>
            <li>
              <strong className="text-gray-200">Contact Form:</strong> Use the contact form on our{' '}
              <Link to="/" className="text-red-400 hover:text-red-300 underline">homepage</Link> to send
              us a message.
            </li>
          </ul>
          <p className="text-gray-300 mb-4 leading-relaxed">
            We will make every effort to respond to your inquiry in a timely manner.
          </p>
        </section>

        {/* Footer */}
        <div className="border-t border-red-900/30 pt-8 mt-16 text-center">
          <Link to="/" className="text-red-400 hover:text-red-300 transition-colors">
            <i className="ri-arrow-left-line mr-2"></i>
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

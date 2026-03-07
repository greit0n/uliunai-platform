import { Link } from 'react-router-dom';

export default function TermsOfService() {
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
          Terms of <span className="text-red-500">Service</span>
        </h1>
        <p className="text-gray-500 mb-12">Last updated: March 2026</p>

        {/* Acceptance of Terms */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Acceptance of Terms</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            By accessing or using the Uliunai.lt website, connecting to our game servers, or interacting
            with any of our community services (collectively, the "Services"), you agree to be bound by
            these Terms of Service ("Terms"). If you do not agree to these Terms, you must not use our
            Services.
          </p>
          <p className="text-gray-300 mb-4 leading-relaxed">
            These Terms constitute a binding agreement between you ("you," "your," or "player") and the
            Uliunai.lt community administration team ("we," "our," or "us"). Please read them carefully
            before using our Services.
          </p>
        </section>

        {/* Description of Service */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Description of Service</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            Uliunai.lt is a community-operated platform dedicated to the Killing Floor 1 gaming community.
            Our Services include, but are not limited to:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-400">
            <li>Hosting and maintaining dedicated Killing Floor 1 game servers</li>
            <li>Providing a community website with server information, news, and resources</li>
            <li>Collecting and displaying player statistics, leaderboards, and match histories</li>
            <li>Offering server administration tools for authorized administrators</li>
            <li>Providing community communication channels and support</li>
            <li>Future services such as VIP memberships and additional game server support</li>
          </ul>
          <p className="text-gray-300 mb-4 leading-relaxed">
            Our Services are provided free of charge unless otherwise stated (such as optional VIP
            memberships). We reserve the right to modify, suspend, or discontinue any aspect of our
            Services at any time without prior notice.
          </p>
        </section>

        {/* Server Rules */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Server Rules</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            All players connecting to our Killing Floor 1 game servers are expected to abide by the
            following rules. Violation of these rules may result in warnings, temporary bans, or permanent
            bans at the discretion of the administration team.
          </p>

          <h3 className="text-lg font-semibold text-white mb-2">Fair Play</h3>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-400">
            <li>Play fairly and in the spirit of cooperative gameplay.</li>
            <li>Do not intentionally sabotage your team or grief other players.</li>
            <li>Do not abuse game mechanics in ways that negatively impact other players' experience.</li>
          </ul>

          <h3 className="text-lg font-semibold text-white mb-2">No Cheating or Hacking</h3>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-400">
            <li>The use of cheats, hacks, aimbots, wallhacks, speed hacks, or any other unauthorized
              third-party software that provides an unfair advantage is strictly prohibited.</li>
            <li>Exploiting known bugs or glitches for personal gain or to disrupt gameplay is not
              permitted. If you discover a bug, please report it to an administrator.</li>
            <li>Modified game clients that alter gameplay mechanics are not allowed.</li>
          </ul>

          <h3 className="text-lg font-semibold text-white mb-2">Respect and Conduct</h3>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-400">
            <li>Treat all players and administrators with respect.</li>
            <li>Harassment, hate speech, discrimination, excessive toxicity, or targeted abuse of any kind
              will not be tolerated.</li>
            <li>Do not spam the chat, use excessive profanity, or engage in disruptive behavior.</li>
            <li>Do not impersonate administrators or other players.</li>
            <li>Follow the instructions of server administrators. Admin decisions are final during
              gameplay.</li>
          </ul>

          <h3 className="text-lg font-semibold text-white mb-2">No Exploiting</h3>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-400">
            <li>Do not exploit map glitches, clipping bugs, or unintended game behaviors to gain unfair
              advantages or to bypass intended game mechanics.</li>
            <li>Do not use external tools to manipulate your connection, statistics, or in-game economy.</li>
          </ul>
        </section>

        {/* VIP Membership */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">VIP Membership</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            We may offer optional VIP memberships that provide additional benefits on our servers. The
            following terms apply to VIP memberships:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-400">
            <li>
              <strong className="text-gray-200">Non-Refundable:</strong> VIP membership payments are
              non-refundable once the membership has been activated. By purchasing a VIP membership,
              you acknowledge and accept this policy.
            </li>
            <li>
              <strong className="text-gray-200">Benefits Subject to Change:</strong> The specific
              benefits included with VIP membership may be modified, added to, or removed at any time
              at the discretion of the administration team. We will make reasonable efforts to communicate
              significant changes to VIP members.
            </li>
            <li>
              <strong className="text-gray-200">Admin Discretion:</strong> VIP status does not exempt
              players from server rules. Administrators retain full authority to enforce rules regardless
              of VIP status, including the right to revoke VIP benefits in cases of serious rule
              violations.
            </li>
            <li>
              <strong className="text-gray-200">Service Availability:</strong> VIP benefits are contingent
              on server availability. We do not guarantee uninterrupted access to VIP features.
            </li>
          </ul>
        </section>

        {/* Account Termination and Bans */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Account Termination and Bans</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            The administration team reserves the right to restrict, suspend, or permanently ban any player
            from our servers and services for violations of these Terms, server rules, or for any behavior
            deemed detrimental to the community.
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-400">
            <li>
              <strong className="text-gray-200">Warnings:</strong> Minor or first-time offenses may
              result in a verbal or written warning.
            </li>
            <li>
              <strong className="text-gray-200">Temporary Bans:</strong> Repeated or moderate violations
              may result in a temporary ban of varying duration.
            </li>
            <li>
              <strong className="text-gray-200">Permanent Bans:</strong> Severe violations, including
              cheating, hacking, or extreme misconduct, may result in an immediate and permanent ban.
            </li>
            <li>
              <strong className="text-gray-200">Ban Appeals:</strong> Players who have been banned may
              appeal their ban through our community Discord server. Appeals will be reviewed by the
              administration team, and decisions on appeals are final. Please provide your Steam ID and
              a clear explanation when submitting an appeal.
            </li>
          </ul>
          <p className="text-gray-300 mb-4 leading-relaxed">
            Bans may be applied by IP address, Steam ID, or other identifying information. Attempting to
            circumvent a ban by using alternative accounts, VPNs, or other methods is itself a violation
            and may result in extended penalties.
          </p>
        </section>

        {/* Intellectual Property */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Intellectual Property</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            Killing Floor is the property of Tripwire Interactive, LLC. All game assets, trademarks, and
            related intellectual property belong to their respective owners. Uliunai.lt is an independent
            community project and is not affiliated with, endorsed by, or sponsored by Tripwire Interactive.
          </p>
          <p className="text-gray-300 mb-4 leading-relaxed">
            The Uliunai.lt website design, custom tools, server configurations, and original content
            created for this platform are the property of the Uliunai.lt community team. You may not
            reproduce, distribute, or create derivative works from our original content without prior
            written permission.
          </p>
          <p className="text-gray-300 mb-4 leading-relaxed">
            User-generated content submitted to our services (such as contact form messages) remains the
            property of the original author. By submitting content, you grant us a non-exclusive,
            royalty-free license to use that content for the purpose of operating our Services.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Limitation of Liability</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            Our Services are provided on an "as is" and "as available" basis without warranties of any
            kind, whether express or implied. We do not guarantee:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-6 text-gray-400">
            <li>Uninterrupted or error-free operation of our game servers or website</li>
            <li>The accuracy, reliability, or completeness of any statistics or information displayed</li>
            <li>That our Services will meet your specific requirements or expectations</li>
            <li>The security of data transmitted to or from our Services</li>
          </ul>
          <p className="text-gray-300 mb-4 leading-relaxed">
            To the maximum extent permitted by applicable law, the Uliunai.lt community team shall not be
            liable for any direct, indirect, incidental, consequential, or special damages arising out of
            or in connection with your use of our Services, including but not limited to loss of data,
            loss of revenue, or interruption of gameplay.
          </p>
          <p className="text-gray-300 mb-4 leading-relaxed">
            As a community-operated project, our Services are maintained on a volunteer basis. Server
            downtime, maintenance windows, and service interruptions may occur without advance notice.
          </p>
        </section>

        {/* Modifications to Terms */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Modifications to Terms</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            We reserve the right to modify these Terms at any time. When we make changes, we will update
            the "Last updated" date at the top of this page. We may also notify the community of
            significant changes through our Discord server or website announcements.
          </p>
          <p className="text-gray-300 mb-4 leading-relaxed">
            Your continued use of our Services after any modifications to these Terms constitutes your
            acceptance of the revised Terms. If you do not agree to the updated Terms, you must discontinue
            use of our Services.
          </p>
          <p className="text-gray-300 mb-4 leading-relaxed">
            We encourage you to review these Terms periodically to stay informed about the conditions
            governing your use of our Services.
          </p>
        </section>

        {/* Governing Framework */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Governing Framework</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            Uliunai.lt is a community-managed project. These Terms are governed by the principles of fair
            and reasonable community management. Any disputes arising from or relating to these Terms or
            your use of our Services will be resolved by the administration team.
          </p>
          <p className="text-gray-300 mb-4 leading-relaxed">
            If you have a dispute or concern, we encourage you to first attempt to resolve it by contacting
            an administrator through our Discord server. We are committed to fair and transparent conflict
            resolution within our community.
          </p>
        </section>

        {/* Severability */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Severability</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            If any provision of these Terms is found to be unenforceable or invalid, that provision shall
            be limited or eliminated to the minimum extent necessary so that the remaining provisions of
            these Terms shall remain in full force and effect.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-10 border-l-2 border-red-900/30 pl-6">
          <h2 className="text-2xl font-bold text-white mb-4 font-orbitron">Contact Us</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">
            If you have any questions or concerns about these Terms of Service, please reach out to us
            through the following channels:
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
            We appreciate your cooperation in helping us maintain a fair and enjoyable gaming community
            for all players.
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

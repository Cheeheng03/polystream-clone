"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto text-foreground">
      <div className="flex items-center gap-2 px-4 pt-4 fixed top-0 w-full bg-background z-10">
        <button
          className="p-2 rounded-full"
          onClick={() => router.push("/sign-in")}
        >
          <ArrowLeft className="w-6 h-6 text-primary" />
        </button>
        <h1 className="text-lg font-bold text-foreground leading-tight">
          Privacy Policy
        </h1>
      </div>

      <div className="p-6 pt-16 pb-24">
        <h2 className="text-xl font-semibold mt-8 mb-2">
          A. Introduction / Scope
        </h2>
        <p>
          Polystream is the data controller for the Polystream PWA (the "App").
          This policy explains how we collect, use, share, and protect your
          data. By using Polystream, you consent to this policy.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          B. What Data We Collect
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>
            <b>Account &amp; Authentication Data:</b> Email (if using Privy or
            similar), social login identifiers, Web3Auth keyshares, wallet
            addresses, and public keys.
          </li>
          <li>
            <b>On-Chain Activity:</b> Transaction history (deposits,
            withdrawals, swaps), token balances, and vault interactions.
          </li>
          <li>
            <b>Usage &amp; Analytics:</b> IP address, device/browser details,
            app usage metrics (pages visited, time spent, clicks).
          </li>
          <li>
            <b>Third-Party Integrations:</b> DeFi protocols (Aave, LayerBank,
            etc.), on-chain oracle providers (Chainlink).
          </li>
          <li>
            <b>Cookies &amp; Local Storage:</b> Essential cookies (session,
            CSRF), optional analytics cookies, local storage for PWA state.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          C. How We Use Your Data
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>
            To provide core services: execute deposits, withdrawals, yield
            calculations, and auto-rebalancing.
          </li>
          <li>Authenticate you and secure your session.</li>
          <li>
            Improve app stability, monitor usage, detect and prevent fraud.
          </li>
          <li>Send transactional emails (confirmations, security alerts).</li>
          <li>Send marketing emails only if you opt in.</li>
          <li>
            Comply with legal and regulatory requirements (KYC/AML, lawful
            requests).
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          D. Data Sharing &amp; Third Parties
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>
            <b>Service Providers:</b> Auth providers (Privy, Web3Auth),
            analytics (Google Analytics, Mixpanel), hosting/CDN (Vercel).
          </li>
          <li>
            <b>DeFi Protocols &amp; Oracles:</b> Aave, LayerBank, SyncSwap,
            EigenLayer, etc.
          </li>
          <li>
            <b>Legal Obligations:</b> We may share data to comply with
            subpoenas, court orders, or legal process.
          </li>
          <li>
            <b>Business Transfers:</b> In the event of merger, acquisition, or
            sale, user data may be transferred with notice.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">E. Data Retention</h2>
        <ul className="list-disc ml-6 mb-2">
          <li>
            Account data is retained until account deletion or up to 5 years for
            regulatory compliance.
          </li>
          <li>Analytics data is retained for up to 12 months.</li>
          <li>
            Users can request data deletion or account closure. Some anonymized
            data may remain for statistical/backup purposes.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          F. Security Measures
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>Data is encrypted in transit (HTTPS/TLS) and at rest.</li>
          <li>Role-based access controls and least privilege for employees.</li>
          <li>MFA for admin accounts.</li>
          <li>
            Incident response plan: breaches are detected, contained, and users
            notified within 72 hours if required by law.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">G. User Rights</h2>
        <ul className="list-disc ml-6 mb-2">
          <li>You can request a copy of your personal data.</li>
          <li>You can correct inaccurate data.</li>
          <li>You can request erasure (right to be forgotten).</li>
          <li>You can request your data in a machine-readable format.</li>
          <li>
            You can restrict processing or opt out of certain uses (e.g.,
            marketing).
          </li>
          <li>
            To exercise your rights, email{" "}
            <a
              href="mailto:privacy@polystream.xyz"
              className="underline text-primary"
            >
              privacy@polystream.xyz
            </a>
            . We will respond within 30 days.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          H. Children's Privacy
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>The App is not intended for users under 18.</li>
          <li>We do not knowingly collect data from minors.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          I. Cookies &amp; Similar Technologies
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>
            Essential cookies are used for login/session management and
            security.
          </li>
          <li>
            Analytics cookies are optional and used to improve the App; you may
            opt out.
          </li>
          <li>
            PWA storage (IndexedDB, localStorage) is used for offline
            functionality and preferences.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          J. International Data Transfers
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>
            Data may be stored on servers in the USA, EU, or other
            jurisdictions.
          </li>
          <li>
            For GDPR, we use Standard Contractual Clauses or similar mechanisms
            for cross-border transfers.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          K. Policy Changes &amp; Notification
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>
            This policy may be updated from time to time. The latest version
            will always be posted here.
          </li>
          <li>
            We may notify you by email or in-app banner when changes occur.
            Continued use implies acceptance.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          L. Contact Information
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>
            Email:{" "}
            <a
              href="mailto:privacy@polystream.xyz"
              className="underline text-primary"
            >
              privacy@polystream.xyz
            </a>
          </li>
          {/* <li>Mailing Address: [Insert address if required]</li> */}
        </ul>

        <div className="mt-8 text-xs text-muted-foreground">
          For more details, contact us at{" "}
          <a
            href="mailto:privacy@polystream.xyz"
            className="underline text-primary"
          >
            privacy@polystream.xyz
          </a>
          .
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
          Terms of Service
        </h1>
      </div>

      <div className="p-6 pt-16 pb-24">
        <h2 className="text-xl font-semibold mt-8 mb-2">
          A. Introduction / Acceptance of Terms
        </h2>
        <p>
          By accessing or using Polystream, you agree to be bound by these Terms
          &amp; Conditions. If you do not agree, do not use the App. We may
          update these Terms at any time. Continued use of the App after changes
          means you accept the revised Terms.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          B. Eligibility / Account Registration
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>
            You must be at least 18 years old or the legal age in your
            jurisdiction.
          </li>
          <li>
            Use of the App may be restricted in certain countries or
            jurisdictions.
          </li>
          <li>
            You may register using email, social login, or Web3Auth. You are
            responsible for keeping your credentials secure.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          C. Description of Services
        </h2>
        <p>
          Polystream is a one-click stablecoin yield aggregator that routes
          funds to DeFi strategies (such as lending, restaking, and BTC vaults)
          across various chains. Strategies are non-custodial, have no lock-up,
          and allow instant deposit/withdrawal. All APY figures are estimates
          and may fluctuate with market conditions.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          D. User Obligations &amp; Conduct
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>You must provide accurate personal and wallet information.</li>
          <li>
            No illegal use, including money laundering or illicit transactions.
          </li>
          <li>
            You must comply with all local crypto regulations and tax laws.
          </li>
          <li>
            You are responsible for securing your wallets, keys, and login
            credentials.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          E. Risk Disclosure / Non-Liability
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>
            Polystream does not provide investment, tax, or legal advice. Use
            the App at your own risk.
          </li>
          <li>
            Risks include smart contract bugs, exploits, impermanent loss,
            protocol insolvency, and chain-level vulnerabilities.
          </li>
          <li>
            To the fullest extent permitted by law, we disclaim all liability
            for any direct, indirect, or consequential damages arising from your
            use of the App.
          </li>
          <li>
            We integrate with third-party protocols (Aave, LayerBank, SyncSwap,
            EigenLayer, etc.) and are not responsible for their failures, hacks,
            or governance changes.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          F. Fees &amp; Payment
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>Performance fee: 0.5% on profits.</li>
          <li>Withdrawal or network fees may be passed through.</li>
          <li>Fees are auto-deducted from yield or on withdrawal.</li>
          <li>
            You are responsible for reporting and paying any applicable taxes on
            earnings.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          G. Intellectual Property
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>
            Polystream owns all rights to the App&apos;s code, UI/UX, logos, and
            content.
          </li>
          <li>
            You are granted a limited, revocable license to use the App per
            these Terms.
          </li>
          <li>
            No reverse engineering, copying, redistribution, scraping, or
            automated data extraction is permitted.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          H. Third-Party Links &amp; Services
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>
            We integrate with protocols such as Aave, LayerBank, Scroll, Base,
            and others.
          </li>
          <li>
            External links are provided for convenience; we do not endorse or
            guarantee third-party services.
          </li>
          <li>APIs and oracles used for price data are outside our control.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          I. Privacy &amp; Data Use
        </h2>
        <p>
          We collect and use user data (such as email, KYC information, and
          on-chain addresses) as described in our Privacy Policy. <br />
          <Link href="/privacy" className="underline text-primary">
            See our Privacy Policy for details.
          </Link>
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          J. Termination / Suspension
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>You may delete or deactivate your account at any time.</li>
          <li>
            We reserve the right to suspend or terminate accounts for violations
            or suspicious activity.
          </li>
          <li>
            Upon termination, your funds, data, and outstanding obligations will
            be handled per these Terms and applicable law.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          K. Dispute Resolution / Governing Law
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>
            These Terms are governed by the laws of your chosen jurisdiction
            (e.g., Singapore, United States, etc.).
          </li>
          <li>
            Disputes may be subject to individual arbitration and not class
            actions, as permitted by law.
          </li>
          <li>
            Crypto laws vary by location; you are responsible for compliance
            with your local regulations.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">
          L. Limitation of Liability &amp; Indemnification
        </h2>
        <ul className="list-disc ml-6 mb-2">
          <li>
            Our maximum liability is capped at the greater of $100 or the total
            fees you&apos;ve paid in the last 12 months.
          </li>
          <li>
            You agree to indemnify Polystream for damages arising from your
            breach of these Terms or illegal actions.
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-2">M. Miscellaneous</h2>
        <ul className="list-disc ml-6 mb-2">
          <li>
            If any part of these Terms is invalid, the rest remains in force.
          </li>
          <li>
            This document and referenced policies (such as the Privacy Policy)
            constitute the entire agreement between you and Polystream.
          </li>
          <li>
            Our failure to enforce any right is not a waiver of that right.
          </li>
        </ul>
      </div>

    </div>
  );
}

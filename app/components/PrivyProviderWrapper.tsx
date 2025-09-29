"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import AuthWrapper from "./AuthWrapper";

export default function PrivyProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#EBC28E",
          logo: "/polystream_logo_trans.png",
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: "all-users",
          showWalletUIs: false, // Always false - no signature modals
          requireUserPasswordOnCreate: false,
        },
        mfa: {
          noPromptOnMfaRequired: false, // Keep as false so enrolled users get MFA prompts
        },
        loginMethods: ["email", "wallet"],
      }}
    >
      <AuthWrapper>{children}</AuthWrapper>
    </PrivyProvider>
  );
}
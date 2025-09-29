"use client";
import { useSearchParams } from "next/navigation";
import { Copy, Check, QrCode, ArrowLeft } from "lucide-react";
import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMultiChainSmartWallet, formatAddress } from "@/app/lib/hooks";
import {
  getChainByNetworkName,
  getTokenContractUrl,
} from "@/app/lib/config/chains";
import QRCode from "qrcode";

function AddressDisplay() {
  const params = useSearchParams();
  const token = params?.get("token") || "USDC";
  const network = params?.get("network") || "Scroll";
  const amount = params?.get("amount") || "";

  const { data: walletSummary, isLoading } = useMultiChainSmartWallet();
  const smartAccountAddress = walletSummary?.smartAccountAddress;

  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const router = useRouter();

  // Function to get token icon
  const getTokenIcon = (tokenName: string) => {
    const tokenLower = tokenName.toLowerCase();
    return `/token/${tokenLower}.png`;
  };

  // Get chain configuration using the centralized function
  const currentChain = getChainByNetworkName(network);

  // Generate QR code when address is available
  useEffect(() => {
    const generateQR = async () => {
      if (!smartAccountAddress) return;

      try {
        const qrUrl = await QRCode.toDataURL(smartAccountAddress, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrCodeUrl(qrUrl);
      } catch (err) {
        console.error("Failed to generate QR code: ", err);
      }
    };

    generateQR();
  }, [smartAccountAddress]);

  const handleCopy = async () => {
    if (!smartAccountAddress) return;

    try {
      await navigator.clipboard.writeText(smartAccountAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="animate-pulse">Loading wallet address...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center px-4 pt-4 pb-2">
        <button
          className="mr-2 p-2 rounded-full hover:bg-gray-100"
          onClick={() =>
            router.push(`/receive/select-network?token=${token}&from=back`)
          }
        >
          <ArrowLeft className="w-6 h-6 text-primary" />
        </button>
      </div>

      <div className="px-6 pb-16">
        <div className="mb-5">
          <h1 className="text-3xl font-bold mb-1">Receive {token}</h1>
          <p className="text-gray-400 text-base mb-4">
            Share this address to receive {token} on {network}
          </p>

          {/* Network Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-2 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Network:</span>
              <span className="font-medium">{network}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Chain ID:</span>
              <span className="font-medium">{currentChain.chain.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Token:</span>
              {token.toLowerCase() === "eth" ? (
                <div className="font-medium flex items-center gap-1">
                  <img
                    src={getTokenIcon(token)}
                    alt={token}
                    className="w-5 h-5"
                  />
                  {token}
                </div>
              ) : (
                (() => {
                  const contractUrl = getTokenContractUrl(currentChain, token);
                  return contractUrl ? (
                    <a
                      href={contractUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline flex items-center gap-1"
                    >
                      <img
                        src={getTokenIcon(token)}
                        alt={token}
                        className="w-5 h-5"
                      />
                      {token}
                    </a>
                  ) : (
                    <div className="font-medium flex items-center gap-1">
                      <img
                        src={getTokenIcon(token)}
                        alt={token}
                        className="w-5 h-5"
                      />
                      {token}
                      <span className="text-xs text-gray-500 ml-1">
                        (Not supported)
                      </span>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="mb-4 flex justify-center">
          {isLoading ? (
            <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
              <span className="text-gray-400 text-sm">Generating QR...</span>
            </div>
          ) : qrCodeUrl ? (
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
            </div>
          ) : (
            <div className="w-40 h-40 bg-gray-100 rounded-xl flex items-center justify-center">
              <span className="text-gray-400 text-sm">QR unavailable</span>
            </div>
          )}
        </div>

        {/* Address Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between px-4 py-6 bg-gray-50 rounded-xl">
            <div className="flex flex-col gap-2 flex-1 mr-4 w-[70%]">
              <span className="text-gray-500 text-xs font-medium">
                Your Smart Account Address
              </span>
              <span className="font-mono text-sm text-black break-all leading-relaxed">
                {smartAccountAddress || "Loading..."}
              </span>
            </div>
            <button
              className={`flex w-[30%] justify-center items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 flex-shrink-0 ${
                copied
                  ? "bg-green-50 border-green-200 text-green-600"
                  : "bg-white border-gray-200 text-black hover:bg-gray-50"
              }`}
              onClick={handleCopy}
              disabled={!smartAccountAddress}
              aria-label={copied ? "Address copied" : "Copy address"}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
          <div className="text-yellow-800 font-semibold text-base mb-2">
            ⚠️ Important Warning
          </div>
          <div className="text-yellow-700 text-sm leading-relaxed">
            Only send <strong>{token}</strong> on <strong>{network}</strong> to
            this address. Using the wrong network or token could result in
            permanent loss of your funds.
          </div>
        </div>
      </div>
    </>
  );
}

export default function ReceiveAddressPage() {
  const params = useSearchParams();
  const isFromBack = params?.get("from") === "back";

  return (
    <AnimatePresence>
      <motion.div
        className="min-h-screen h-screen bg-white flex flex-col"
        initial={isFromBack ? { x: 0 } : { x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <Suspense
          fallback={
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
              <div className="animate-pulse">Loading address details...</div>
            </div>
          }
        >
          <AddressDisplay />
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

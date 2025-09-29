import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import QueryProvider from "./lib/query-provider";
import Script from "next/script";
import "./globals.css";
import PrivyProviderWrapper from "./components/PrivyProviderWrapper";
import { MainnetTransactionProvider } from "./components/MainnetTransactionProvider";
import { ToastProvider } from "./components/ui/toast";
import { GlobalRefreshProvider } from "./lib/contexts/GlobalRefreshContext";
import ConsoleDisabler from "./components/ConsoleDisabler";
import PwaTutorialModalWrapper from "./components/PwaTutorialModalWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://app.polystream.xyz'),
  title: "Polystream",
  description: "The simplest way to earn crypto yields",
  openGraph: {
    title: "Polystream",
    description: "The simplest way to earn crypto yields",
    url: 'https://app.polystream.xyz',
    siteName: 'Polystream',
    images: [
      {
        url: "/og-image-v1.png",
        width: 1200,
        height: 628,
        alt: "Polystream - The simplest way to earn crypto yields",
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Polystream",
    description: "The simplest way to earn crypto yields",
    images: ["/og-image-v1.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        
        {/* Manual OG tags */}
        <meta property="og:title" content="Polystream" />
        <meta property="og:description" content="The simplest way to earn crypto yields" />
        <meta property="og:image" content="https://app.polystream.xyz/og-image-v1.png" />
        <meta property="og:url" content="https://app.polystream.xyz" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Polystream" />
        <meta property="og:locale" content="en_US" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Polystream" />
        <meta name="twitter:description" content="The simplest way to earn crypto yields" />
        <meta name="twitter:image" content="https://app.polystream.xyz/og-image-v1.png" />
        
        <Script
          id="amplitude-analytics"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(e,t){var r=e.amplitude||{_q:[],_iq:{}};var n=t.createElement("script")
              ;n.type="text/javascript"
              ;n.async=true
                ;n.src="https://cdn.amplitude.com/script/${process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY}.js"
              ;n.onload=function(){
                if(e.amplitude.runQueuedFunctions){
                  e.amplitude.add(e.sessionReplay.plugin({sampleRate: 1}));
                  e.amplitude.init('${process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY}', {"fetchRemoteConfig":true,"autocapture":true});
                } else {
                  console.log("[Amplitude] Error: could not load SDK")
                }
              }
              ;var s=t.getElementsByTagName("script")[0];s.parentNode.insertBefore(n,s)
              ;function i(e,t){e.prototype[t]=function(){
              this._q.push([t].concat(Array.prototype.slice.call(arguments,0)));return this}}
              var o=function(){this._q=[];return this}
              ;var a=["add","append","clearAll","prepend","set","setOnce","unset","preInsert","postInsert","remove"]
              ;for(var c=0;c<a.length;c++){i(o,a[c])}r.Identify=o;var u=function(){this._q=[]
              ;return this}
              ;var p=["setProductId","setQuantity","setPrice","setRevenueType","setEventProperties"]
              ;for(var l=0;l<p.length;l++){i(u,p[l])}r.Revenue=u
              ;var d=["init","logEvent","logRevenue","setUserId","setUserProperties","setOptOut","setVersionName","setDomain","setDeviceId","enableTracking","setGlobalUserProperties","identify","clearUserProperties","setGroup","logRevenueV2","regenerateDeviceId","groupIdentify","onInit","logEventWithTimestamp","logEventWithGroups","setSessionId","resetSessionId","getDeviceId","getUserId","setMinTimeBetweenSessionsMillis","setEventUploadThreshold","setUseDynamicConfig","setServerZone","setServerUrl","sendEvents","setLibrary","setTransport"]
              ;function v(e){function t(t){e[t]=function(){
              e._q.push([t].concat(Array.prototype.slice.call(arguments,0)))}}
              for(var r=0;r<d.length;r++){t(d[r])}}v(r);r.getInstance=function(e){
              e=(!e||e.length===0?"$default_instance":e).toLowerCase()
              ;if(!Object.prototype.hasOwnProperty.call(r._iq,e)){r._iq[e]={_q:[]};v(r._iq[e])
              }return r._iq[e]};e.amplitude=r})(window,document);
            `
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConsoleDisabler />
        <QueryProvider>
          <ServiceWorkerRegistration />
          <PrivyProviderWrapper>
            <MainnetTransactionProvider>
              <ToastProvider>
                <GlobalRefreshProvider>
                  <PwaTutorialModalWrapper />
                  {children}
                </GlobalRefreshProvider>
              </ToastProvider>
            </MainnetTransactionProvider>
          </PrivyProviderWrapper>
        </QueryProvider>
      </body>
    </html>
  );
}

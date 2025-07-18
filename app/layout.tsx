import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Helix - A Digital Business Card",
  description: "Create a memorable connection with a digital business card",
  metadataBase: new URL('https://www.helixcard.app'),
  alternates: {
    canonical: 'https://www.helixcard.app',
  },
  openGraph: {
    title: "Helix - A Digital Business Card",
    description: "Create a memorable connection with a digital business card",
    url: 'https://www.helixcard.app',
    siteName: 'HelixCard',
    type: 'website',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Digital Business Card Platform'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: "Helix - A Digital Business Card",
    description: "Create a memorable connection with a digital business card",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2TP2DP1BB0"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2TP2DP1BB0');
          `}
        </Script>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

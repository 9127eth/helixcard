import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Helix - A Digital Business Card",
  description: "Create a memorable connection with a digital business card",
  openGraph: {
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Digital Business Card Platform'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

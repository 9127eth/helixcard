'use client';

import React, { useState } from 'react';
import Layout from '../components/Layout';
import Image from 'next/image';
import { Download, Copy, Check, Mail } from 'lucide-react';

const BRAND_COLORS = [
  {
    name: 'Helix Teal',
    hex: '#7CCEDA',
    rgb: '124, 206, 218',
    usage: 'Primary brand color, buttons, and highlights',
    textClass: 'text-gray-800',
  },
  {
    name: 'Soft Mint',
    hex: '#F5FDFD',
    rgb: '245, 253, 253',
    usage: 'Page backgrounds and light surfaces',
    textClass: 'text-gray-800',
    swatchClass: 'ring-1 ring-inset ring-black/10',
  },
  {
    name: 'Helix Lime',
    hex: '#B8EB41',
    rgb: '184, 235, 65',
    usage: 'Secondary accent and emphasis',
    textClass: 'text-gray-800',
  },
  {
    name: 'Coral',
    hex: '#FC9A99',
    rgb: '252, 154, 153',
    usage: 'Supporting accent for links and CTAs',
    textClass: 'text-gray-800',
  },
  {
    name: 'Flame',
    hex: '#FF6A42',
    rgb: '255, 106, 66',
    usage: 'Logo handles and high-contrast accents',
    textClass: 'text-white',
  },
  {
    name: 'Ink',
    hex: '#000000',
    rgb: '0, 0, 0',
    usage: 'Logo wordmark and primary text',
    textClass: 'text-white',
  },
];

const PressKitPage: React.FC = () => {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      window.setTimeout(() => {
        setCopiedValue((current) => (current === value ? null : current));
      }, 2000);
    } catch (error) {
      console.error('Unable to copy value', error);
    }
  };

  const downloadFile = async (src: string, filename: string) => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Unable to download file', error);
    }
  };

  return (
    <Layout title="Press Kit - HelixCard" showSidebar={false} showHeader={false}>
      <div className="min-h-screen bg-gradient-to-b from-[#F5FDFD] to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 pt-8 pb-6">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <a href="/" className="inline-flex items-center">
              <Image
                src="/logo.png"
                alt="Helix Logo"
                width={120}
                height={63}
                priority
                className="h-auto"
              />
            </a>
            <a
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Back to home
            </a>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-12 md:pb-16">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800 dark:text-white">
              Helix <span className="text-[#7CCEDA]">Press Kit</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Official logos, product images, and brand colors for press, partnerships, and media. Please use these assets as provided.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-800 dark:text-white">Logo</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              PNG with a transparent background, 1024 × 536. Best on light or dark surfaces without recoloring or stretching.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white p-8 flex flex-col items-center justify-center min-h-[240px] shadow-sm">
                <Image
                  src="/logo.png"
                  alt="Helix logo on a light background"
                  width={280}
                  height={147}
                  className="h-auto"
                />
                <p className="mt-6 text-sm text-gray-500">Light background</p>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-[#111111] p-8 flex flex-col items-center justify-center min-h-[240px] shadow-sm">
                <Image
                  src="/logo.png"
                  alt="Helix logo on a dark background"
                  width={280}
                  height={147}
                  className="h-auto"
                />
                <p className="mt-6 text-sm text-gray-400">Dark background</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => downloadFile('/logo.png', 'helix-logo.png')}
                className="inline-flex items-center justify-center px-6 py-3 bg-[#7CCEDA] hover:bg-[#6bb9c7] text-gray-800 font-medium rounded-lg transition-colors duration-300"
              >
                <Download className="w-4 h-4 mr-2" />
                Download logo (PNG)
              </button>
              <button
                type="button"
                onClick={() => downloadFile('/og-image.png', 'helix-social.png')}
                className="inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-lg border border-gray-300 transition-colors duration-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download social image
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-800 dark:text-white">Product image</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              The phone mockup from the Personalized Digital Cards section. PNG, 1200 × 628, with a transparent background.
            </p>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-sm mb-8">
              <Image
                src="/helix-phone.png"
                alt="Helix digital cards shown on three phones"
                width={1200}
                height={628}
                className="w-full h-auto rounded-xl"
              />
            </div>

            <button
              type="button"
              onClick={() => downloadFile('/helix-phone.png', 'helix-personalized-digital-cards.png')}
              className="inline-flex items-center justify-center px-6 py-3 bg-[#7CCEDA] hover:bg-[#6bb9c7] text-gray-800 font-medium rounded-lg transition-colors duration-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Download product image (PNG)
            </button>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-gray-800 dark:text-white">Brand colors</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              These are the colors used across Helix. Click a swatch to copy its hex value.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {BRAND_COLORS.map((color) => {
                const isCopied = copiedValue === color.hex;
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => copyToClipboard(color.hex)}
                    className="text-left bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    aria-label={`Copy ${color.name} hex ${color.hex}`}
                  >
                    <div
                      className={`h-28 px-5 flex items-end pb-4 ${color.textClass} ${color.swatchClass ?? ''}`}
                      style={{ backgroundColor: color.hex }}
                    >
                      <span className="font-semibold tracking-wide">{color.hex}</span>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-white">{color.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">RGB {color.rgb}</p>
                        </div>
                        <span className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
                          {isCopied ? (
                            <>
                              <Check className="w-4 h-4 mr-1 text-[#7CCEDA]" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">{color.usage}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Usage guidelines</h2>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li>Use the official logo as provided. Do not recolor, stretch, rotate, or add effects.</li>
                <li>Keep clear space around the wordmark so it stays readable.</li>
                <li>Prefer Helix Teal for primary brand moments and Ink for the wordmark.</li>
                <li>Do not place the logo on busy photos or low-contrast backgrounds.</li>
              </ul>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">About Helix</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Helix is a digital business card platform that helps people share contact details, social links, and a professional profile through a link, QR code, or NFC tap.
              </p>
              <a
                href="mailto:hello@helixcard.app"
                className="inline-flex items-center text-gray-800 dark:text-white font-medium hover:text-[#3B8A99] dark:hover:text-[#7CCEDA]"
              >
                <Mail className="w-4 h-4 mr-2" />
                hello@helixcard.app
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 py-6 border-t border-gray-100 dark:border-gray-800">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} Helix Business Card. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PressKitPage;

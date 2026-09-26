import type { Metadata } from 'next';
import HomeClient from './components/home/HomeClient';
import { loadDemoCard } from './components/home/demoCard';
import { FAQ } from './components/home/faq';
import { pageMetadata } from './lib/seo';

const SITE_URL = 'https://www.helixcard.app/';

export const metadata: Metadata = pageMetadata({
  title: 'Helix: Free Digital Business Card with QR Code and NFC',
  description:
    'Make your next connection memorable. Helix is a free digital business card you share by QR code, tap, or link, with no app needed to open it.',
  path: '/',
});

/** Who publishes the site, the name search results should give it, and the questions answered on the page. */
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}#organization`,
      name: 'Helix',
      url: SITE_URL,
      logo: `${SITE_URL}logo.png`,
      email: 'support@helixcard.app',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}#website`,
      name: 'Helix',
      alternateName: ['HelixCard', 'Helix Digital Business Card'],
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}#organization` },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ],
};

export default async function Home() {
  const demoCard = await loadDemoCard();
  return (
    <>
      <script
        type="application/ld+json"
        // Escaped as Next's docs recommend, though every value here is static.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <HomeClient demoCard={demoCard} />
    </>
  );
}

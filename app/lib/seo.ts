import type { Metadata } from 'next';

const OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'Helix digital business card',
};

/**
 * Title, description, canonical URL and link-preview tags for one public page.
 *
 * Every public page needs its own: without them a page inherits the root
 * layout's, and before Sept 2026 that meant every page on the site named the
 * home page as its canonical URL.
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: 'HelixCard',
      type: 'website',
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

/** For account pages (sign-up, password reset, email verification): useful to visitors, not to search. */
export const NOINDEX: Metadata['robots'] = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
};

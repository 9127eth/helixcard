import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { schibsted } from './components/home/fonts';
import styles from './components/home/home.module.css';

export const metadata: Metadata = {
  title: 'Page Not Found | Helix',
};

/** Unknown URLs, and cards that are missing or switched off. Served with a 404 status. */
export default function NotFound() {
  return (
    <div className={`${schibsted.variable} ${styles.tokens} ${styles.page}`}>
      <header className="mx-auto max-w-[1240px] px-4 pb-2 pt-4 sm:px-6 lg:px-8 lg:pt-6">
        <Link href="/" aria-label="Helix home" className="inline-block rounded-md">
          <Image src="/logo.png" alt="Helix" width={1024} height={536} priority className="h-10 w-auto lg:h-12" />
        </Link>
      </header>
      <main className="mx-auto max-w-[1240px] px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <h1 className={styles.heading}>Page not found</h1>
        <p className="mt-5 max-w-[34rem] text-lg leading-[1.55]">
          The link may have a typo, or the card or page it points to is no longer available.
        </p>
        <div className="mt-9">
          <Link href="/" className={styles.button}>
            Go to the home page
          </Link>
        </div>
      </main>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import CardDemo from './CardDemo';
import AuthDialog, { type AuthMode } from './AuthDialog';
import { DEMO_CARD_URL } from './demoCard';
import { FAQ } from './faq';
import { schibsted } from './fonts';
import type { BusinessCard } from '../../types';
import styles from './home.module.css';

const APP_STORE_URL = 'https://apps.apple.com/us/app/helix-digital-business-card/id6736955244';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.rxradio.helix&pcampaignid=web_share';
const NFC_SHOP_URL = 'https://shop.rxradio.fm/collections/all/products/tap-to-share-nfc-cards-powered-by-helix-2-pack';

const SHARING = [
  { term: 'QR code', detail: 'Every card has its own. Show it on your phone, or print it on a sign or a paper card.' },
  { term: 'NFC tap', detail: 'Link your card to a tap-to-share NFC card, and one tap on their phone opens it.' },
  { term: 'Link', detail: 'Text it, email it, AirDrop it, or put it in your bio and email signature.' },
  { term: 'Apple Wallet', detail: 'Add it to Wallet from the iPhone app, so your code is a swipe away.' },
];

/** Limits and gates as enforced in lib/constants.ts, lib/cardEffects.ts and the card editor. */
const PLAN_ROWS: { feature: string; free: string | boolean; pro: string | boolean }[] = [
  { feature: 'Cards', free: '1', pro: 'Up to 10' },
  { feature: 'Designs', free: 'All 9', pro: 'All 9' },
  { feature: 'Effects', free: '2', pro: 'All 12' },
  { feature: 'QR, link, NFC, and Wallet sharing', free: true, pro: true },
  { feature: 'Custom colors', free: false, pro: true },
  { feature: 'Attach a PDF, like a résumé or menu', free: false, pro: true },
  { feature: 'Scan cards and badges into contacts', free: false, pro: true },
  { feature: 'Contacts', free: '2', pro: 'Up to 1,000' },
];

const PAPER_COMPARISON = [
  { situation: 'To start', paper: 'About $50 for 250 cards', helix: 'Free, or $19.99 once for Pro' },
  { situation: 'New job, title, or number', paper: 'Order a new batch', helix: 'Edit your card' },
  { situation: 'Running out at an event', paper: 'It happens', helix: 'It can’t' },
];

const FOOTER_LINKS = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/shop', label: 'NFC cards' },
  { href: '/support', label: 'Support' },
  { href: '/presskit', label: 'Press kit' },
  { href: '/privacy-policy', label: 'Privacy' },
  { href: '/terms-of-service', label: 'Terms' },
];

function StoreBadges() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="rounded-[9px]">
        <Image src="/downloadios.png" alt="Download on the App Store" width={2560} height={759} className="h-11 w-auto" />
      </a>
      {/* The Play badge ships with transparent padding; the negative margin trims it to match. */}
      <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="rounded-[9px]">
        <Image src="/google-play-badge.png" alt="Get it on Google Play" width={646} height={250} className="-m-[11px] h-[66px] w-auto max-w-none" />
      </a>
    </div>
  );
}

function PlanValue({ value }: { value: string | boolean }) {
  if (typeof value === 'string') return <>{value}</>;
  return value ? (
    <>
      <span aria-hidden>✓</span>
      <span className="sr-only">Included</span>
    </>
  ) : (
    <>
      <span aria-hidden className="text-[var(--hx-muted)]">—</span>
      <span className="sr-only">Not included</span>
    </>
  );
}

/** A conference badge in a camera frame, and the contact Helix makes from it. */
function BadgeToContact() {
  const corner = 'absolute h-5 w-5 border-[var(--hx-handle)]';
  return (
    <div aria-hidden className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:gap-10">
      <div className="relative shrink-0 p-3">
        <span className={`${corner} left-0 top-0 border-l-2 border-t-2`} />
        <span className={`${corner} right-0 top-0 border-r-2 border-t-2`} />
        <span className={`${corner} bottom-0 left-0 border-b-2 border-l-2`} />
        <span className={`${corner} bottom-0 right-0 border-b-2 border-r-2`} />
        {/* Paper stays paper in dark mode. */}
        <div className="flex h-[12.5rem] w-[9.5rem] -rotate-2 flex-col rounded-[12px] border-2 border-black bg-white px-4 pb-4 pt-3 text-black">
          <span className="mx-auto h-2 w-10 rounded-full border-2 border-black" />
          <p className={`${styles.badgeName} mt-6`}>
            Jordan
            <br />
            Lane
          </p>
          <p className="mt-auto text-[0.6875rem] leading-snug">
            Pharmacist
            <br />
            Bright Health Pharmacy
          </p>
        </div>
      </div>
      <div className="w-full max-w-[18rem] rounded-[14px] border border-[var(--hx-line)] p-5">
        <p className="font-semibold">Jordan Lane</p>
        <p className="mt-0.5 text-sm text-[var(--hx-muted)]">Pharmacist, Bright Health Pharmacy</p>
        <p className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full border border-[var(--hx-ink)] px-2.5 py-1">Midyear</span>
          <span className="rounded-full border border-[var(--hx-ink)] px-2.5 py-1">Follow up</span>
        </p>
        <p className="mt-4 text-sm text-[var(--hx-muted)]">Asked about residency sites.</p>
      </div>
    </div>
  );
}

export default function MarketingHome({ demoCard }: { demoCard: BusinessCard }) {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  useEffect(() => {
    // Older links, including the partner pages, point at /#auth, where the sign-up form used to sit.
    const hash = window.location.hash;
    if (hash === '#auth' || hash === '#signup') setAuthMode('signup');
    if (hash === '#login') setAuthMode('login');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement;
    root.style.scrollBehavior = 'smooth';
    return () => { root.style.scrollBehavior = ''; };
  }, []);

  const signUp = () => setAuthMode('signup');

  const pitch = (
    <div>
      <p className="max-w-[34rem] text-lg leading-[1.55] md:text-[1.3125rem]">
        Helix is a digital business card you share with a QR code, a tap, or a link. The people you meet open it in
        their browser and save you to their contacts, without installing anything.
      </p>
      <div className="mt-9">
        <button type="button" onClick={signUp} className={styles.button}>
          Make your free card
        </button>
      </div>
      <p className="mt-4 text-sm text-[var(--hx-muted)]">Your first card is free and stays free. No credit card.</p>
      <div className="mt-9">
        <StoreBadges />
      </div>
    </div>
  );

  return (
    <div className={`${schibsted.variable} ${styles.tokens} ${styles.page}`}>
      <header className="mx-auto flex max-w-[1240px] items-center justify-between px-4 pb-2 pt-4 sm:px-6 lg:px-8 lg:pt-6">
        <Link href="/" aria-label="Helix home" className="rounded-md">
          <Image src="/logo.png" alt="Helix" width={1024} height={536} priority className="h-10 w-auto lg:h-12" />
        </Link>
        <nav className="flex items-center gap-1 text-[0.9375rem] font-medium sm:gap-3">
          <a href="#pricing" className="rounded-lg px-3 py-2 hover:underline hover:underline-offset-4">Pricing</a>
          <button type="button" onClick={() => setAuthMode('login')} className="rounded-lg px-3 py-2 hover:underline hover:underline-offset-4">
            Log in
          </button>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-[1240px] px-4 pb-16 pt-8 sm:px-6 md:pb-24 md:pt-12 lg:px-8 lg:pb-36 lg:pt-10">
          <h1 className={styles.display}>Make your next connection memorable.</h1>
          <div className="mt-7 md:mt-10 lg:mt-12">
            <CardDemo card={demoCard} pitch={pitch} />
          </div>
        </section>

        <section>
          <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)] gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20 lg:px-8 lg:py-20">
            <div className="max-w-[40rem]">
              <h2 className={styles.heading}>Sharing your card</h2>
              <p className="mt-5 text-lg leading-[1.55]">
                From your card, people can save your details to their contacts, call or text you, and open your links.
              </p>
              <dl className="mt-10 border-b border-[var(--hx-line)]">
                {SHARING.map(item => (
                  <div key={item.term} className="grid gap-1 border-t border-[var(--hx-line)] py-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
                    <dt className="font-semibold">{item.term}</dt>
                    <dd className="text-[var(--hx-muted)]">
                      {item.detail}
                      {item.term === 'NFC tap' && (
                        <>
                          {' '}
                          <a href={NFC_SHOP_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--hx-ink)] underline underline-offset-4 hover:no-underline">
                            Get NFC cards
                          </a>
                        </>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-8 text-lg leading-[1.55]">
                When your job or number changes, edit your card. Anyone with your link sees the update.
              </p>
            </div>

            <figure className="w-full max-w-[26rem] justify-self-start lg:mt-3 lg:w-[26rem]">
              <div className={`${styles.frame} flex aspect-[7/4] items-stretch justify-between gap-4 p-5 sm:p-7`}>
                <div className="flex min-w-0 flex-col justify-between">
                  <div>
                    <p className={`${styles.subheading} text-[1.375rem] sm:text-[1.625rem]`}>Jordan Lane</p>
                    <p className="mt-1.5 text-[0.8125rem] leading-snug text-[var(--hx-muted)] sm:text-sm">
                      Pharmacist
                      <br />
                      Bright Health Pharmacy
                    </p>
                  </div>
                  <p className="truncate text-[0.6875rem] text-[var(--hx-muted)] sm:text-xs">helixcard.app/c/9odg5w/kq9</p>
                </div>
                <div className="self-center rounded-lg bg-white p-2">
                  <QRCodeSVG
                    value={DEMO_CARD_URL}
                    size={104}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#000000"
                    title="QR code that opens Jordan Lane’s card"
                    className="h-[5.5rem] w-[5.5rem] sm:h-[6.5rem] sm:w-[6.5rem]"
                  />
                </div>
              </div>
              <figcaption className="mt-7 text-sm leading-snug text-[var(--hx-muted)]">
                <span className="hidden md:inline">Point your phone’s camera at the code to open Jordan’s card, just as someone you meet would.</span>
                <span className="md:hidden">
                  This code opens Jordan’s card.{' '}
                  <a href={DEMO_CARD_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--hx-ink)] underline underline-offset-4">
                    Open it here
                  </a>
                </span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section>
          <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)] items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20 lg:px-8 lg:py-20">
            <div className="max-w-[36rem]">
              <h2 className={styles.heading}>Getting theirs</h2>
              <p className="mt-5 text-lg leading-[1.55]">
                Take a photo of a paper business card or a conference badge, and Helix fills in the contact for you. Add
                tags and a note about where you met, then export everything as a CSV file for your CRM when it’s time to
                follow up.
              </p>
              <p className="mt-4 text-[var(--hx-muted)]">Scanning is part of Pro.</p>
            </div>
            <BadgeToContact />
          </div>
        </section>

        <section id="pricing">
          <div className="mx-auto max-w-[1240px] px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pb-28 lg:pt-32">
            <div className="max-w-[40rem]">
              <h2 className={styles.heading}>Pricing</h2>
              <p className="mt-5 text-lg leading-[1.55]">
                Everyone starts with a free card. Upgrade to Pro any time from your account.
              </p>
            </div>

            <table className="mt-12 w-full max-w-[52rem] border-b border-[var(--hx-line)] text-left">
              <thead>
                <tr className="align-top">
                  <th scope="col" className="w-[44%] pb-6"><span className="sr-only">Feature</span></th>
                  <th scope="col" className="w-[20%] pb-6 pr-4 font-normal md:w-[22%]">
                    <span className={`${styles.subheading} block`}>Free</span>
                    <span className={`${styles.price} mt-3 block`}>$0</span>
                  </th>
                  <th scope="col" className="pb-6 font-normal">
                    <span className={`${styles.subheading} block`}>Pro</span>
                    <span className="mt-3 block">
                      <span className={styles.price}>$19.99</span>
                      <span className="ml-1.5 font-semibold">once</span>
                    </span>
                    <span className="mt-2 block text-sm text-[var(--hx-muted)]">or $12.99 a year, or $2.99 a month</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {PLAN_ROWS.map(row => (
                  <tr key={row.feature} className="border-t border-[var(--hx-line)] align-top">
                    <th scope="row" className="py-3.5 pr-4 font-medium">{row.feature}</th>
                    <td className="py-3.5 pr-4"><PlanValue value={row.free} /></td>
                    <td className="py-3.5"><PlanValue value={row.pro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-10">
              <button type="button" onClick={signUp} className={styles.button}>
                Make your free card
              </button>
            </div>

            <div className="mt-24 max-w-[52rem]">
              <h3 className={styles.subheading}>Compared with printed cards</h3>
              <table className="mt-6 w-full border-b border-[var(--hx-line)] text-left text-[0.9375rem] md:text-base">
                <thead>
                  <tr className="text-sm text-[var(--hx-muted)]">
                    <th scope="col" className="w-[36%] pb-3 font-medium md:w-[44%]"><span className="sr-only">Situation</span></th>
                    <th scope="col" className="w-[30%] pb-3 pr-4 font-medium md:w-[22%]">Printed cards</th>
                    <th scope="col" className="pb-3 font-medium">Helix</th>
                  </tr>
                </thead>
                <tbody>
                  {PAPER_COMPARISON.map(row => (
                    <tr key={row.situation} className="border-t border-[var(--hx-line)] align-top">
                      <th scope="row" className="py-3.5 pr-4 font-medium">{row.situation}</th>
                      <td className="py-3.5 pr-4 text-[var(--hx-muted)]">{row.paper}</td>
                      <td className="py-3.5">{row.helix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="questions">
          <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <h2 className={styles.heading}>Questions</h2>
            {/* Native disclosure: answers are in the page for search engines, and open without JavaScript. */}
            <div className="mt-10 max-w-[52rem] border-b border-[var(--hx-line)]">
              {FAQ.map(item => (
                <details key={item.question} className={`${styles.faq} border-t border-[var(--hx-line)]`}>
                  <summary className="flex cursor-pointer items-center justify-between gap-6 py-5 text-lg font-semibold leading-snug">
                    {item.question}
                    <span aria-hidden className={styles.faqToggle} />
                  </summary>
                  <p className="-mt-1 max-w-[40rem] pb-6 leading-[1.55] text-[var(--hx-muted)]">{item.answer}</p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-[var(--hx-muted)]">
              Another question? Email{' '}
              <a href="mailto:support@helixcard.app" className="font-medium text-[var(--hx-ink)] underline underline-offset-4 hover:no-underline">
                support@helixcard.app
              </a>
              .
            </p>
          </div>
        </section>

        <section>
          <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)] items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-20 lg:px-8 lg:py-28">
            {/* A blank card with its name selected, like the H in the logo. */}
            <div className={`${styles.frame} flex aspect-[7/4] w-full max-w-[34rem] flex-col justify-center px-8 sm:px-12`} aria-hidden>
              <p className={`${styles.cardName} relative w-fit`}>
                Your name
                <span className={styles.selectBox} />
              </p>
              <p className="mt-5 text-base text-[var(--hx-muted)] sm:text-lg">Your title, your company</p>
            </div>
            <div className="max-w-[32rem]">
              <h2 className={styles.heading}>Make your card</h2>
              <p className="mt-5 text-lg leading-[1.55]">
                Sign up with Google, Apple, or your email. Add your details and a photo, pick a design, and your card is
                ready to share.
              </p>
              <div className="mt-9">
                <button type="button" onClick={signUp} className={styles.button}>
                  Make your free card
                </button>
              </div>
              <div className="mt-9">
                <StoreBadges />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--hx-line)]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 py-10 text-sm sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map(link => (
              <Link key={link.href} href={link.href} className="rounded-sm hover:underline hover:underline-offset-4">
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-[var(--hx-muted)]">© {new Date().getFullYear()} Helix Business Card</p>
        </div>
      </footer>

      <AuthDialog mode={authMode} onClose={() => setAuthMode(null)} />
    </div>
  );
}

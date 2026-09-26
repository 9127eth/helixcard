/**
 * The home page's questions, shown in the Questions section and published as
 * FAQPage structured data from app/page.tsx. Every answer is enforced in code:
 * limits in lib/constants.ts, prices in lib/stripePrices.ts and the plan table,
 * what cancelling does in api/webhook (lib/adminCards.ts), keeping cards out of
 * search in next.config.mjs and c/layout.tsx, and account deletion in
 * api/delete-account. Keep them plain text; the structured data reuses them.
 */
export const FAQ: { question: string; answer: string }[] = [
  {
    question: 'Do people need an app to open my card?',
    answer:
      'No. Your card opens in the web browser on any phone, iPhone or Android, and they can save you to their contacts right from it.',
  },
  {
    question: 'Can I make my card on the website, or do I need the app?',
    answer:
      'Either. Make and edit your card here or in the iPhone or Android app; it’s the same account. You’ll need the app to add your card to Apple Wallet or write it to an NFC card.',
  },
  {
    question: 'What can I put on my card?',
    answer:
      'Your name, credentials, pronouns, title, company, and photo, plus your phone, email, website links, social profiles, and a few lines about yourself. With Pro you can also attach a PDF, like a résumé or menu.',
  },
  {
    question: 'Do I need an NFC card?',
    answer:
      'No. Your QR code and link work on their own. An NFC card is an extra: link it to your card in the Helix app, and one tap on someone’s phone opens your card.',
  },
  {
    question: 'Can I have more than one card?',
    answer:
      'Yes. With Pro you can have up to 10, like one for your job and one for a side business. Each has its own link and QR code.',
  },
  {
    question: 'Is Pro a subscription?',
    answer:
      'Only if you want it to be. Pay $19.99 once and Pro is yours for good, with nothing to renew. Or pay $12.99 a year or $2.99 a month, and cancel any time in Settings.',
  },
  {
    question: 'What happens if I cancel Pro?',
    answer:
      'Pro stays on until the end of the period you’ve paid for. After that, your main card stays live without the Pro extras, your other cards go offline until you upgrade again, and nothing is deleted.',
  },
  {
    question: 'Will my card show up in Google?',
    answer:
      'No. Cards are marked to stay out of Google and other search engines, so yours is seen by the people you share it with.',
  },
  {
    question: 'Can I delete my account?',
    answer: 'Yes, any time, in Settings. Your cards, contacts, and uploaded files are deleted along with it.',
  },
];

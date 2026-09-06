const APP_NAME = 'HelixCard';
const BRAND_COLOR = '#7CCEDA';
const TEXT_COLOR = '#18181B';
const MUTED_COLOR = '#52525B';
const IOS_APP_URL = 'https://apps.apple.com/us/app/helix-digital-business-card/id6736955244';
const ANDROID_APP_URL = 'https://play.google.com/store/apps/details?id=com.rxradio.helix';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function button(label: string, href: string, secondary = false): string {
  const background = secondary ? '#18181B' : BRAND_COLOR;
  const color = secondary ? '#FFFFFF' : '#18181B';

  return `<a href="${href}" style="display:inline-block;background:${background};color:${color};text-decoration:none;padding:13px 22px;border-radius:999px;font-size:15px;font-weight:700;">${label}</a>`;
}

function layout(content: string, preheader: string, headerName = APP_NAME): string {
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;background:#F4F4F5;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${TEXT_COLOR};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4F4F5;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E4E4E7;border-radius:20px;overflow:hidden;">
          <tr><td style="height:8px;background:${BRAND_COLOR};font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td style="padding:34px 36px 36px;">
            <p style="margin:0 0 28px;font-size:20px;font-weight:800;letter-spacing:-0.02em;">${headerName}</p>
            ${content}
            <p style="margin:32px 0 0;padding-top:22px;border-top:1px solid #E4E4E7;color:#71717A;font-size:12px;line-height:1.6;">Sent by HelixCard · <a href="https://www.helixcard.app" style="color:#3F7F89;">helixcard.app</a></p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function welcomeEmail({
  displayName,
  dashboardUrl,
  verificationUrl,
}: {
  displayName?: string;
  dashboardUrl: string;
  verificationUrl?: string;
}) {
  const greeting = displayName ? `Hi ${escapeHtml(displayName)},` : 'Hi there,';
  const verificationSection = verificationUrl
    ? `<div style="margin-top:32px;padding:22px;background:#F4F4F5;border-radius:14px;">
        <p style="margin:0 0 8px;font-size:16px;font-weight:750;">One quick account check</p>
        <p style="margin:0 0 18px;color:${MUTED_COLOR};font-size:14px;line-height:1.6;">Confirm your email address so we know it belongs to you and can keep account recovery secure.</p>
        ${button('Verify email address', verificationUrl, true)}
      </div>`
    : '';

  return {
    subject: 'Welcome to Helix!',
    html: layout(`
      <p style="margin:0 0 10px;color:${MUTED_COLOR};font-size:15px;">${greeting}</p>
      <h1 style="margin:0 0 14px;font-size:30px;line-height:1.18;letter-spacing:-0.035em;">Welcome to a better way to network.</h1>
      <p style="margin:0 0 24px;color:${MUTED_COLOR};font-size:16px;line-height:1.7;">HelixCard helps you create customizable, interactive cards that feel like you. Turn introductions into memorable networking moments.</p>
      <div style="margin:0 0 26px;padding:22px;border:1px solid #E4E4E7;border-radius:14px;">
        <p style="margin:0 0 14px;font-size:16px;font-weight:750;">A few things to try</p>
        <p style="margin:0 0 12px;color:${MUTED_COLOR};font-size:15px;line-height:1.55;"><strong style="color:${TEXT_COLOR};">Make your card yours.</strong> Add the details, links, colors, and interactive touches that bring your personal brand to life.</p>
        <p style="margin:0;color:${MUTED_COLOR};font-size:15px;line-height:1.55;"><strong style="color:${TEXT_COLOR};">Never lose a paper card.</strong> Use the card scanner to capture contact details and keep new connections organized.</p>
      </div>
      <div style="margin:0 0 6px;">
        <p style="margin:0 0 6px;font-size:16px;font-weight:750;">Get the Helix app</p>
        <p style="margin:0 0 16px;color:${MUTED_COLOR};font-size:15px;line-height:1.6;">The mobile app is the best way to share your card, scan paper cards, and set up NFC taps. If you have not installed it yet, grab it here:</p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;">
          <tr><td>${button('Download on the App Store', IOS_APP_URL)}</td></tr>
          <tr><td>${button('Get it on Google Play', ANDROID_APP_URL)}</td></tr>
        </table>
        <p style="margin:12px 0 0;color:#71717A;font-size:13px;line-height:1.6;">Already have the app? You are all set. Prefer a bigger screen? You can also <a href="${dashboardUrl}" style="color:#3F7F89;">manage your cards on the web</a>.</p>
      </div>
      ${verificationSection}
      <p style="margin:28px 0 0;color:${MUTED_COLOR};font-size:14px;line-height:1.65;">Have a question or need support? Just reply to this email—we’re happy to help.</p>
    `, 'Download the Helix app to share your card, scan paper cards, and set up NFC taps.', 'Helix Digital Business Card'),
    text: `${greeting}\n\nWelcome to a better way to network.\n\nHelixCard helps you create customizable, interactive cards that feel like you. Turn introductions into memorable networking moments. Add your details, links, colors, and interactive touches, then use the card scanner to capture contact details and keep new connections organized.\n\nGet the Helix app. The mobile app is the best way to share your card, scan paper cards, and set up NFC taps. If you have not installed it yet:\niPhone: ${IOS_APP_URL}\nAndroid: ${ANDROID_APP_URL}\n\nAlready have the app? You are all set. You can also manage your cards on the web: ${dashboardUrl}${verificationUrl ? `\n\nOne quick account check: verify your email address so we can keep account recovery secure.\n${verificationUrl}` : ''}\n\nHave a question or need support? Just reply to this email—we’re happy to help.\n\n— The HelixCard team`,
  };
}

export function verificationEmail(verificationUrl: string) {
  return {
    subject: 'Verify your HelixCard email address',
    html: layout(`
      <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;letter-spacing:-0.03em;">Verify your email address</h1>
      <p style="margin:0 0 24px;color:${MUTED_COLOR};font-size:16px;line-height:1.7;">Confirm that this email belongs to you. This helps keep your HelixCard account and account recovery secure.</p>
      ${button('Verify email address', verificationUrl)}
      <p style="margin:24px 0 0;color:#71717A;font-size:13px;line-height:1.6;">If you did not request this email, you can safely ignore it.</p>
    `, 'Verify the email address on your HelixCard account.'),
    text: `Verify your HelixCard email address\n\nConfirm that this email belongs to you. This helps keep your account and account recovery secure.\n\n${verificationUrl}\n\nIf you did not request this email, you can safely ignore it.`,
  };
}

export function passwordResetEmail(resetUrl: string) {
  return {
    subject: 'Reset your HelixCard password',
    html: layout(`
      <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;letter-spacing:-0.03em;">Reset your password</h1>
      <p style="margin:0 0 24px;color:${MUTED_COLOR};font-size:16px;line-height:1.7;">We received a request to reset your HelixCard password. Use the secure link below to choose a new one.</p>
      ${button('Reset password', resetUrl)}
      <p style="margin:24px 0 0;color:#71717A;font-size:13px;line-height:1.6;">If you did not request a password reset, you can safely ignore this email. Your password will not change.</p>
    `, 'Use this secure link to reset your HelixCard password.'),
    text: `Reset your HelixCard password\n\nUse this secure link to choose a new password:\n${resetUrl}\n\nIf you did not request a password reset, you can safely ignore this email. Your password will not change.`,
  };
}

export function emailChangeEmail(changeUrl: string) {
  return {
    subject: 'Confirm your new HelixCard email address',
    html: layout(`
      <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;letter-spacing:-0.03em;">Confirm your new email</h1>
      <p style="margin:0 0 24px;color:${MUTED_COLOR};font-size:16px;line-height:1.7;">Use the button below to confirm this address and finish updating your HelixCard account.</p>
      ${button('Confirm new email', changeUrl)}
      <p style="margin:24px 0 0;color:#71717A;font-size:13px;line-height:1.6;">If you did not request this change, do not click the button and contact HelixCard support.</p>
    `, 'Confirm your new email address for HelixCard.'),
    text: `Confirm your new HelixCard email address\n\nUse this secure link to finish updating your account:\n${changeUrl}\n\nIf you did not request this change, do not open the link and contact HelixCard support.`,
  };
}

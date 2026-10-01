import { NextResponse } from 'next/server'
import { auth, db } from '@/app/lib/firebase-admin'
import { FieldPath } from 'firebase-admin/firestore'
import { consumeQuota } from '@/app/lib/usageQuota'
import { sendEmail, textAttachment } from '@/app/lib/resend'
import { sanitizeEmailAddress } from '@/app/lib/urlSafety'

// Firestore caps `in` / `documentId() in` queries at 30 values per query.
// We chunk the requested IDs and merge the results client-side.
const CONTACT_ID_CHUNK_SIZE = 30

// Far above any real export (1,000 contacts is a few hundred KB) and well
// inside Resend's 40 MB message limit once base64-encoded.
const MAX_CSV_BYTES = 10 * 1024 * 1024

interface Contact {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  position?: string;
  company?: string;
  address?: string;
  tags?: string[];
  note?: string;
  dateAdded?: unknown;
  dateModified?: unknown;
  contactSource?: string;
}

/**
 * Contact dates are Firestore Timestamps (web and iOS writes); a few legacy web
 * rows hold ISO strings. `new Date(timestamp)` is Invalid Date on the Admin
 * SDK, whose Timestamp#valueOf returns a string.
 */
function toDate(value: unknown): Date | null {
  if (value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }
  if (value instanceof Date || typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

/** The browser's IANA zone, or UTC when it is missing or unknown here. */
function resolveTimeZone(value: unknown): string {
  if (typeof value !== 'string' || !value || value.length > 64) return 'UTC'
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return value
  } catch {
    return 'UTC'
  }
}

export async function POST(request: Request) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    let uid: string
    try {
      uid = (await auth.verifyIdToken(token)).uid
    } catch {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    if (!uid) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured properly' },
        { status: 503 }
      )
    }

    const { contactIds, email, timeZone } = await request.json()

    const requestedIds: string[] = Array.isArray(contactIds)
      ? [...new Set(contactIds.filter((id: unknown): id is string => typeof id === 'string' && id !== '' && !id.includes('/')))]
      : []
    if (requestedIds.length === 0) {
      return NextResponse.json(
        { error: 'No contacts selected for export' },
        { status: 400 }
      )
    }

    const recipient = sanitizeEmailAddress(email)
    if (!recipient) {
      return NextResponse.json(
        { error: 'Enter a valid email address' },
        { status: 400 }
      )
    }

    // Sent from here rather than via /api/send-email, whose per-IP limits saw
    // every web export as Vercel's shared outbound IP. An export emails an
    // attachment to any address, so each account gets its own ceiling.
    const HOUR = 60 * 60 * 1000
    const quota = await consumeQuota([
      { key: `contacts-export:user:${uid}`, limit: 20, windowMs: HOUR },
      { key: `contacts-export:user:day:${uid}`, limit: 100, windowMs: 24 * HOUR },
    ])
    if (!quota.allowed) {
      return NextResponse.json(
        { error: 'Too many exports. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(quota.retryAfterSeconds) } }
      )
    }

    // Fetch only the selected contacts in chunks of 30 (Firestore's `in` query
    // limit). Previously we read the entire contacts subcollection and filtered
    // in-memory — fine for tens of contacts, expensive for thousands.
    const contactsRef = db.collection(`users/${uid}/contacts`)
    const idChunks: string[][] = []
    for (let i = 0; i < requestedIds.length; i += CONTACT_ID_CHUNK_SIZE) {
      idChunks.push(requestedIds.slice(i, i + CONTACT_ID_CHUNK_SIZE))
    }

    const chunkSnapshots = await Promise.all(
      idChunks.map((chunk) =>
        contactsRef.where(FieldPath.documentId(), 'in', chunk).get()
      )
    )

    const selectedContacts: Contact[] = chunkSnapshots
      .flatMap((snap) =>
        snap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data(),
        }) as Contact)
      )
      .sort((a, b) => (toDate(b.dateModified)?.getTime() ?? 0) - (toDate(a.dateModified)?.getTime() ?? 0))

    // Contacts store tag ids; the export shows names, as the iOS export does.
    const tagNames = new Map<string, string>()
    if (selectedContacts.some(contact => contact.tags?.length)) {
      const tagsSnapshot = await db.collection(`users/${uid}/tags`).get()
      tagsSnapshot.docs.forEach((tag: FirebaseFirestore.QueryDocumentSnapshot) => {
        const name = tag.data().name
        if (typeof name === 'string') tagNames.set(tag.id, name)
      })
    }

    const dateFormat = new Intl.DateTimeFormat('en-US', {
      timeZone: resolveTimeZone(timeZone),
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
    const formatDate = (value: unknown) => {
      const date = toDate(value)
      return date ? dateFormat.format(date) : ''
    }

    // Generate CSV content
    const csvHeaders = [
      'Full Name',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Position',
      'Company',
      'Address',
      'Tags',
      'Notes',
      'Date Added',
      'Date Modified',
      'Contact Source'
    ]

    const csvRows = selectedContacts.map((contact: Contact) => [
      contact.name || '',
      contact.firstName || '',
      contact.lastName || '',
      contact.email || '',
      contact.phone || '',
      contact.position || '',
      contact.company || '',
      contact.address || '',
      (Array.isArray(contact.tags) ? contact.tags : [])
        .map(tagId => tagNames.get(tagId))
        .filter((name): name is string => name !== undefined)
        .join(', '),
      contact.note || '',
      formatDate(contact.dateAdded),
      formatDate(contact.dateModified),
      contact.contactSource || ''
    ])

    // Sanitise a CSV cell value to prevent formula injection.
    // Excel / Sheets treat cells starting with =, +, -, @, \t, \r as
    // formulas.  Prefixing with a single-quote neutralises the formula
    // while remaining human-readable.  Internal double-quotes are also
    // escaped per RFC 4180.
    function sanitizeCsvCell(value: string): string {
      let sanitized = value.replace(/"/g, '""')
      if (/^[=+\-@\t\r]/.test(sanitized)) {
        sanitized = `'${sanitized}`
      }
      return sanitized
    }

    // The byte order mark tells Excel the file is UTF-8, so accented and
    // non-Latin names open correctly.
    const csvContent = '\uFEFF' + [
      csvHeaders.join(','),
      ...csvRows.map((row: string[]) => row.map((cell: string) => `"${sanitizeCsvCell(cell)}"`).join(','))
    ].join('\n')

    if (Buffer.byteLength(csvContent, 'utf8') > MAX_CSV_BYTES) {
      return NextResponse.json(
        { error: 'This export is too large to email. Please export fewer contacts at a time.' },
        { status: 413 }
      )
    }

    const fileName = `helix-contacts-export-${new Date().toISOString().split('T')[0]}.csv`

    // Same message the shared /api/send-email route sends for a csvExport.
    await sendEmail({
      to: recipient,
      subject: 'Your Helix Contacts Export',
      html: `
        <!doctype html>
        <html lang="en">
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
          <body style="margin:0;background:#F4F4F5;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#18181B;">
            <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your Helix contacts export is attached as a CSV file.</div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F4F4F5;padding:32px 16px;">
              <tr><td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#FFFFFF;border:1px solid #E4E4E7;border-radius:20px;overflow:hidden;">
                  <tr><td style="height:8px;background:#7CCEDA;font-size:0;line-height:0;">&nbsp;</td></tr>
                  <tr><td style="padding:34px 36px 36px;">
                    <p style="margin:0 0 28px;font-size:20px;font-weight:800;letter-spacing:-0.02em;">HelixCard</p>
                    <h1 style="margin:0 0 14px;font-size:28px;line-height:1.2;letter-spacing:-0.03em;">Your contacts export is ready</h1>
                    <p style="margin:0 0 24px;color:#52525B;font-size:16px;line-height:1.7;">The contacts you requested from Helix are attached to this email as a CSV file. Open it in Excel, Google Sheets, or any spreadsheet app.</p>
                    <div style="padding:18px 20px;background:#F4F4F5;border-radius:14px;">
                      <p style="margin:0 0 4px;font-size:13px;font-weight:700;letter-spacing:0.02em;text-transform:uppercase;color:#71717A;">Attached</p>
                      <p style="margin:0;color:#18181B;font-size:15px;line-height:1.6;">Your Helix contacts as a CSV file</p>
                    </div>
                    <p style="margin:32px 0 0;padding-top:22px;border-top:1px solid #E4E4E7;color:#71717A;font-size:12px;line-height:1.6;">Sent by HelixCard · <a href="https://www.helixcard.app" style="color:#3F7F89;">helixcard.app</a></p>
                  </td></tr>
                </table>
              </td></tr>
            </table>
          </body>
        </html>
      `,
      text: 'Your contacts export is ready.\n\nThe contacts you requested from Helix are attached to this email as a CSV file. Open it in Excel, Google Sheets, or any spreadsheet app.',
      attachments: [textAttachment(fileName, csvContent)],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export contacts' },
      { status: 500 }
    )
  }
} 

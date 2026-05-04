import { NextResponse } from 'next/server'
import { auth, db } from '@/app/lib/firebase-admin'
import { FieldPath } from 'firebase-admin/firestore'

// Firestore caps `in` / `documentId() in` queries at 30 values per query.
// We chunk the requested IDs and merge the results client-side.
const CONTACT_ID_CHUNK_SIZE = 30

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
  dateAdded?: number;
  dateModified?: number;
  contactSource?: string;
}

export async function POST(request: Request) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    if (!decodedToken.uid) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { contactIds, email } = await request.json()

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: 'No contacts selected for export' },
        { status: 400 }
      )
    }

    // Fetch only the selected contacts in chunks of 30 (Firestore's `in` query
    // limit). Previously we read the entire contacts subcollection and filtered
    // in-memory — fine for tens of contacts, expensive for thousands.
    const contactsRef = db.collection(`users/${decodedToken.uid}/contacts`)
    const idChunks: string[][] = []
    for (let i = 0; i < contactIds.length; i += CONTACT_ID_CHUNK_SIZE) {
      idChunks.push(contactIds.slice(i, i + CONTACT_ID_CHUNK_SIZE))
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
        }))
      )
      .sort((a: Contact, b: Contact) => (b.dateModified ?? 0) - (a.dateModified ?? 0)) as Contact[]

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
      contact.tags?.join(', ') || '',
      contact.note || '',
      contact.dateAdded ? new Date(contact.dateAdded).toLocaleDateString('en-US') : '',
      contact.dateModified ? new Date(contact.dateModified).toLocaleDateString('en-US') : '',
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

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row: string[]) => row.map((cell: string) => `"${sanitizeCsvCell(cell)}"`).join(','))
    ].join('\n')

    // Get the base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
      `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`)

    // Send the email using the existing email endpoint (pass the auth token)
    const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        type: 'csvExport',
        email: email,
        csvData: csvContent,
        fileName: `helix-contacts-export-${new Date().toISOString().split('T')[0]}.csv`
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Email service error:', errorText)
      throw new Error(`Failed to send export email: ${errorText}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export contacts' },
      { status: 500 }
    )
  }
} 
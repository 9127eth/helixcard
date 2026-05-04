import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebase-admin';
import vision from '@google-cloud/vision';
import OpenAI from 'openai';

// Initialize Vision client
const client = new vision.ImageAnnotatorClient({
  credentials: JSON.parse(process.env.GOOGLE_VISION_CREDENTIALS || '{}'),
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim(),
});

export async function POST(req: Request) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authentication token' }, { status: 401 });
    }

    // Extract and verify the ID token
    const idToken = authHeader.split('Bearer ')[1];
    try {
      await auth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    // Get image data from request
    const formData = await req.formData();
    const imageFile = formData.get('image');
    if (!imageFile || !(imageFile instanceof Blob)) {
      return NextResponse.json({ error: 'No valid image provided' }, { status: 400 });
    }

    // Convert image to buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    // Perform OCR using Google Vision first
    const [result] = await client.textDetection(imageBuffer);
    const detectedText = result.fullTextAnnotation?.text || '';

    if (!detectedText) {
      return NextResponse.json({
        error: 'No text detected in image',
        details: 'The image processing service could not detect any readable text. Please ensure:',
        suggestions: [
          'The image is clear and well-lit',
          'Text is clearly visible and not blurry',
          'The business card or badge is properly aligned',
          'There are no reflections or glare on the surface'
        ]
      }, { status: 400 });
    }

    // Process text with OpenAI.
    // Notes:
    //   - `gpt-4o-mini` matches the model used by /api/scan-card and is far cheaper
    //     and faster than the legacy `gpt-4` we used here previously.
    //   - `response_format: { type: 'json_object' }` forces the model to emit valid
    //     JSON, eliminating the markdown-fence parsing failures we hit before.
    //   - We still defensively strip code fences in case JSON mode is unavailable
    //     for some reason and the model falls back to wrapped output.
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            "You are an AI designed to extract and organize information from text. The text will be either a business card or a tradeshow badge. Extract key details and present them in a structured format following these rules:\n" +
            "- Do not include prefixes like 'Mr.', 'Ms.', 'Dr.', etc. Names should start with first name\n" +
            "- Include suffixes like 'Jr.', 'Sr.', 'III', PharmD, MD, BSN, RN, etc.\n" +
            "- For phone numbers: Extract ONLY ONE phone number in this priority order: 1) mobile/cell number, 2) office/direct number. Never include fax numbers. Format as (123) 456-7890\n" +
            "- If website is not present but email is, assume the domain from email as website\n" +
            "- Do not include registered trademark symbols\n" +
            "- Convert all-caps text to proper case while preserving company names and credentials (e.g., PharmD, MD, BSN, RN, CPhT)\n" +
            'Always respond with a JSON object containing the keys: name, position, company, phone, email, address, website. Use empty strings for missing fields.',
        },
        {
          role: 'user',
          content: `Extract contact information from this text: ${detectedText}`,
        },
      ],
      temperature: 0.3,
    });

    const rawContent = completion.choices[0].message?.content ?? '{}';
    let contactData: Record<string, string> = {};
    try {
      const cleaned = rawContent.replace(/```json\n?|\n?```/g, '').trim();
      contactData = JSON.parse(cleaned || '{}');
    } catch (parseErr) {
      console.error('Failed to parse OCR JSON response:', parseErr, 'raw:', rawContent);
      return NextResponse.json(
        { error: 'Could not parse contact information from this image. Please try again.' },
        { status: 502 }
      );
    }

    // Parse name into first and last name
    const nameParts = contactData.name?.split(' ') || ['', ''];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Format response
    const response = {
      firstName,
      lastName,
      name: contactData.name,
      position: contactData.position,
      company: contactData.company,
      phone: contactData.phone ? String(contactData.phone) : '',
      email: contactData.email,
      address: contactData.address,
      contactSource: 'scanned' as const,
      dateAdded: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      tags: []
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('OCR Processing Error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}

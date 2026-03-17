import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const { fileBase64, fileName } = await req.json();

    if (!fileBase64 || !fileName) {
      return NextResponse.json({ error: 'Missing file data' }, { status: 400 });
    }

    // Ensure uploads directory exists inside the "public" folder
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Secure the filename by replacing spaces and special characters
    const safeFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeFileName);

    // Save the base64 string directly to an actual file on disk
    fs.writeFileSync(filePath, Buffer.from(fileBase64, 'base64'));

    // Return the relative URL which Next.js can serve automatically from /public
    return NextResponse.json({ url: `/uploads/${safeFileName}` });
    
  } catch (error) {
    console.error('Local file upload error:', error);
    return NextResponse.json({ error: 'Failed to upload to local filesystem' }, { status: 500 });
  }
}

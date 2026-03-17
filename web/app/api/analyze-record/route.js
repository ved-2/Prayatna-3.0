import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { fileBase64, mimeType } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        summary: "⚠️ AI Summary Unavailable: GEMINI_API_KEY is not configured in your environment variables. The document was shared successfully, but the AI could not process it automatically." 
      });
    }

    const payload = {
      contents: [
        {
          parts: [
            { text: "You are a senior emergency triage doctor reading a medical record attachment for an incoming hospital patient transfer. Read the context and provide a highly critical, concise, 2-line AI summary of the patient's major condition, any critical alerts or risks, and what immediate medical attention they will require upon arrival. If the document is illegible or not a medical document, state 'Unable to extract coherent medical data from attachment.'" },
            {
              inlineData: {
                mimeType: mimeType,
                data: fileBase64
              }
            }
          ]
        }
      ]
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return NextResponse.json({ summary: "⚠️ AI Summary Unavailable: The AI service could not analyze this document's contents." });
    }

    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || "No actionable summary generated.";
    
    return NextResponse.json({ summary });
    
  } catch (error) {
    console.error("Error analyzing record:", error);
    return NextResponse.json({ summary: "⚠️ AI Analysis failed due to a server connection error." }, { status: 500 });
  }
}

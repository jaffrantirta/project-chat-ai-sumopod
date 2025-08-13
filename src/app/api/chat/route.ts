import { searchDocuments } from '@/services/vectorSearch';
import { NextResponse } from 'next/server';
require('dotenv').config();

export async function POST(req: Request) {
  const { message } = await req.json();

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const contextDocs: { id: string; content: string }[] = await searchDocuments(message);
  const contextText = contextDocs.map(doc => doc.content).join("\n\n");

  console.log('contextText', contextText);

  try {
    const aiRes = await fetch(`${process.env.BASE_URL_AI}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.API_KEY_AI}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
            { role: "system", content: `You are a helpful assistant. Use the following context to answer the user's question: ${contextText}` },
            { role: 'user', content: message }
        ],
        max_tokens: 100,
        temperature: 0.7,
      })
    });

    const data = await aiRes.json();

    // Debug log in server terminal
    console.log("AI Raw Response:", JSON.stringify(data, null, 2));

    // Extract message content
    let aiMessage = data.choices?.[0]?.message?.content?.trim() || '';

    // Handle case where API finished due to token limit but no content yet
    if (!aiMessage && data.choices?.[0]?.finish_reason === 'length') {
      aiMessage = '[⚠️ AI output truncated due to token limit]';
    }
    return NextResponse.json({reply: aiMessage || 'No response'});
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json({ error: 'Failed to contact AI' }, { status: 500 });
  }
}


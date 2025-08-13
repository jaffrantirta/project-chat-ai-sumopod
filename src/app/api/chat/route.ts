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

  console.log('contextText: '+contextText);

  try {
    const aiRes = await fetch(`${process.env.SUMOPOD_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUMOPOD_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
            { role: "system", content: `You are a helpful assistant. Use the following context to answer the user's question: ${contextText}` },
            { role: 'user', content: message }
        ],
        max_tokens: 300,
        temperature: 1,
      })
    });
    const data = await aiRes.json();
    let aiMessage = data.choices?.[0]?.message?.content?.trim() || '';
    if (!aiMessage && data.choices?.[0]?.finish_reason === 'length') {
      aiMessage = '[⚠️ AI output truncated due to token limit]';
    }
    return NextResponse.json({reply: aiMessage || 'No response'});
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json({ error: 'Failed to contact AI' }, { status: 500 });
  }
}


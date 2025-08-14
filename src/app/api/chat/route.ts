import { searchDocuments } from '@/services/vectorSearch';
import { NextResponse } from 'next/server';
import "dotenv/config";


export async function POST(req: Request) {
  const { messages } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
  }

  const someUserMessage = messages.filter(m => m.role === 'user').slice(-3).map(m => m.content).join("\n\n");
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
  const contextDocs: { id: string; content: string }[] =  await searchDocuments(`${someUserMessage}`);
  const contextText = contextDocs.map(doc => doc.content).join("\n\n");
  const today = new Date();

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
          { role: "system", content: `You are a helpful Konsultan Visa assistant. All context is about "Konsultan Visa". Use the following context: ${contextText}. Keep answers concise and in the user's language. dont use markdown format. Today is ${today.toDateString()}. If the message is an inquiry, answer it using only the provided information. If unsure about the answer to an inquiry, state that your knowledge is limited to the specific information provided by this business.If there are multiple inquiries in a message, answer them one by one. Refuse to tell jokes. at the end of your answer, ask user related questions about main idea to make friendly conversation. use friendly tone, don't be too formal.` },
          { role: 'user', content: lastUserMessage }
        ],
        max_tokens: 300,
        temperature: 1,
      })
    });
    const data = await aiRes.json();
    return NextResponse.json({ reply: data.choices?.[0]?.message?.content?.trim() || 'No response' });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json({ error: 'Failed to contact AI' }, { status: 500 });
  }
}



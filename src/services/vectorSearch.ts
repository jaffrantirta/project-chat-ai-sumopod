import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function searchDocuments(query: string) {
  console.log('Query:', query);
  try {
    const embeddingRes = await fetch(`${process.env.SUMOPOD_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUMOPOD_API_KEY}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query
      })
    });

    if (!embeddingRes.ok) {
      console.error('Embedding API error:', await embeddingRes.text());
      throw new Error('Failed to get embedding');
    }

    const embeddingData = await embeddingRes.json();
    const embedding = embeddingData.data[0].embedding;
    
    console.log('Query embedding length:', embedding.length);

    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      throw error;
    }
    
    console.log('Search results count:', data?.length || 0);
    return data || [];
  } catch (err) {
    console.error('Search error:', err);
    return [];
  }
}

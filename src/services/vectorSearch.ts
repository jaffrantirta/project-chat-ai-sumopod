// src/services/vectorSearch.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function searchDocuments(query: string) {
  const embeddingRes = await fetch(`${process.env.BASE_URL_AI}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.API_KEY_AI}`
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: query
    })
  });

  console.log('embeddingRes', embeddingRes);

  const embeddingData = await embeddingRes.json();
  const embedding = embeddingData.data[0].embedding;

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.78,
    match_count: 5
  });

  if (error) throw error;
  return data;
}

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertDocument(content) {
  try {
    const aiRes = await fetch(`${process.env.SUMOPOD_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SUMOPOD_API_KEY}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: content
      })
    });

    const embeddingData = await aiRes.json();
    const embedding = embeddingData.data[0].embedding;


    const { data, error } = await supabase.from('documents').insert([
      { content, embedding }
    ]);

    if (error) throw error;
    console.log('✅ Inserted:', content.slice(0, 50) + '...');
  } catch (err) {
    console.error('❌ Error inserting document:', err);
  }
}

async function insertDataset() {
  const filePath = path.join(__dirname, 'src/data/faq.txt');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const paragraphs = fileContent.split(/\n\n+/);

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed) {
      await insertDocument(trimmed);
    }
  }
}

insertDataset().then(() => {
  console.log('🎉 Dataset insertion finished!');
});

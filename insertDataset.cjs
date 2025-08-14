const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- CLI ARG PARSING ---
const args = process.argv.slice(2);
let filePath = null;

for (const arg of args) {
  if (arg.startsWith('--dir=')) {
    filePath = arg.split('=')[1];
    break;
  }
}

if (!filePath) {
  console.error('❌ Please provide a file path using --dir=<path-to-file>');
  process.exit(1);
}

// Resolve to absolute path
filePath = path.isAbsolute(filePath)
  ? filePath
  : path.join(__dirname, filePath);

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

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

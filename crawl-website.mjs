import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// --- Supabase Client ---
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// --- CLI ARG PARSING ---
const args = process.argv.slice(2);
let startUrl = null;

for (const arg of args) {
  if (arg.startsWith("--url=")) {
    startUrl = arg.split("=")[1];
    break;
  }
}

if (!startUrl) {
  console.error("❌ Please provide a starting URL using --url=<website>");
  process.exit(1);
}

// --- State ---
const visited = new Set();
const baseDomain = new URL(startUrl).origin;

// --- Helpers ---
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Use SUMOPOD GPT-4o-mini to organize text ---
async function organizeText(rawText, url) {
  try {
    const res = await fetch(`${process.env.SUMOPOD_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUMOPOD_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant that reads raw webpage text and outputs a well-organized, concise summary. Include a clear title and structured content and translate content to Bahasa Indonesia",
          },
          {
            role: "user",
            content: `URL: ${url}\n\nRaw page content:\n${rawText}`,
          },
        ],
        max_tokens: 1000,
      }),
    });

    const data = await res.json();
    const organized = data.choices[0].message.content;
    return organized;
  } catch (err) {
    console.error("❌ Error organizing text:", err.message);
    return rawText; // fallback to raw text
  }
}

// --- Generate embedding with SUMOPOD ---
async function generateEmbedding(text) {
  try {
    const res = await fetch(`${process.env.SUMOPOD_URL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUMOPOD_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });

    const data = await res.json();
    return data.data[0].embedding;
  } catch (err) {
    console.error("❌ Error generating embedding:", err.message);
    return null;
  }
}

// --- Insert organized content + embedding into Supabase ---
async function insertDocument(title, url, content, embedding) {
  try {
    const { error } = await supabase.from("documents").insert([
      { title, url, content, embedding },
    ]);
    if (error) throw error;
    console.log("✅ Inserted:", title);
  } catch (err) {
    console.error("❌ Error inserting document:", err.message);
  }
}

// --- Extract visible text from HTML ---
function extractTextFromHTML(html) {
  const cheerio = require("cheerio");
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  let text = $("body").text();
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

// --- Crawl pages recursively ---
async function crawl(url) {
  if (visited.has(url)) return;
  visited.add(url);

  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    const rawText = await page.evaluate(() => {
      return document.body.innerText.replace(/\s+/g, " ").trim();
    });

    if (rawText.length > 50) {
      const organizedText = await organizeText(rawText, url);
      const embedding = await generateEmbedding(organizedText);

      // Extract first line as title
      const titleLine = organizedText.split("\n")[0] || url;

      await insertDocument(titleLine, url, organizedText, embedding);
    }

    const links = await page.$$eval("a", (anchors) =>
      anchors
        .map((a) => a.href)
        .filter((href) => href.startsWith(location.origin))
    );

    for (const link of links) {
      await sleep(500);
      await crawl(link);
    }
  } catch (err) {
    console.error(`❌ Failed to crawl ${url}:`, err.message);
  } finally {
    if (browser) await browser.close();
  }
}

// --- Start ---
(async () => {
  console.log(`🚀 Starting crawl from ${startUrl}`);
  await crawl(startUrl);
  console.log("🎉 Crawl finished!");
})();

const fs = require("fs");
const path = require("path");

// Kata kunci krisis
const crisisWords = ["bunuh diri", "mengakhiri hidup", "tidak ingin hidup", "suicide"];

function crisisText() {
  return `Aku menyesal kamu sedang merasa sangat berat. Jika kamu berada dalam bahaya atau berpikir untuk menyakiti diri sendiri:
- Hubungi layanan darurat setempat
- Hubungi 119 ext 8 (Hotline Kesehatan Jiwa Indonesia)
Kamu tidak sendirian — mencari bantuan adalah langkah berani.`;
}

function loadText(rel) {
  try { return fs.readFileSync(path.join(process.cwd(), rel), "utf8"); }
  catch { return ""; }
}

module.exports = async (req, res) => {
  // Health check cepat
  if (req.method === "GET") return res.status(200).json({ ok: true, msg: "API sehat 👍" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  let { message = "", history = [] } = req.body || {};
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "message required" });
  }

  // Filter krisis
  if (crisisWords.some(w => message.toLowerCase().includes(w))) {
    return res.json({ answer: crisisText() });
  }

  // Susun pesan
  const systemPrompt = loadText("prompts/system.txt");
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6),
    { role: "user", content: message }
  ];

  try {
    // Panggil OpenAI Chat Completions
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.4
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ error: "OpenAI error", detail: text });
    }

    const data = await r.json();
    const answer = data.choices?.[0]?.message?.content ?? "Maaf, aku tidak menemukan jawaban.";
    return res.json({ answer });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: String(err) });
  }
};

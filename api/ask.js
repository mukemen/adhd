const fs = require("fs");
const path = require("path");

const crisisWords = ["bunuh diri", "mengakhiri hidup", "tidak ingin hidup", "suicide"];
const load = (p) => { try { return fs.readFileSync(path.join(process.cwd(), p), "utf8"); } catch { return ""; } };

module.exports = async (req, res) => {
  // (opsional) CORS – isi ALLOW_ORIGIN di Vercel jika frontend di github.io
  if (process.env.ALLOW_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", process.env.ALLOW_ORIGIN);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    if (req.method === "OPTIONS") return res.status(200).end();
  }

  // Health check
  if (req.method === "GET") return res.status(200).json({ ok: true, via: "openrouter" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const KEY = process.env.OPENROUTER_API_KEY;
  if (!KEY) return res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });

  let { message = "", history = [] } = req.body || {};
  if (!message || typeof message !== "string") return res.status(400).json({ error: "message required" });

  if (crisisWords.some(w => message.toLowerCase().includes(w))) {
    return res.json({ answer: "Jika kamu merasa dalam bahaya, hubungi layanan darurat setempat atau 119 ext 8." });
  }

  const messages = [
    { role: "system", content: load("prompts/system.txt") || "Jawab ringkas dan suportif tentang ADHD (edukasi, bukan diagnosis)." },
    ...history.slice(-6),
    { role: "user", content: message }
  ];

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
        ...(process.env.APP_URL ? { "HTTP-Referer": process.env.APP_URL } : {}),
        ...(process.env.APP_NAME ? { "X-Title": process.env.APP_NAME } : {})
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        messages,
        temperature: 0.4
      })
    });

    const text = await r.text();
    if (!r.ok) return res.status(r.status).json({ error: "OpenRouter error", detail: text });

    const data = JSON.parse(text);
    const answer = data.choices?.[0]?.message?.content ?? "Maaf, aku tidak menemukan jawaban.";
    return res.json({ answer }); // <-- penting: field bernama 'answer'
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
};

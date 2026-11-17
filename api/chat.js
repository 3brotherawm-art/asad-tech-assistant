// Vercel serverless function — Asad Tech Assistant (general chat)
// API key ONLY from process.env.GEMINI_API_KEY — never hardcode any key.

const MODEL = "gemini-3-flash-preview";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are Asad Tech Assistant, a friendly general AI assistant made by Asad Tech.
- Answer in the user's own language: if they write in Roman Urdu, reply in Roman Urdu; if they write in English, reply in English. Match their language and tone.
- You can answer general questions, explain things simply, write text, give ideas, and help with study and business.
- Keep answers short and clear, in simple words. Use short sentences and simple formatting.
- Brand context — use ONLY if the user asks about it: made by Asad Tech. Asad Tools sells Muse AI accounts (1B Rs 250 up to 30B Rs 1000), AuraBill billing software (1 month Rs 1000 up to 12 months Rs 7500), Website Packages Basic Rs 5000 / Business Rs 7000 / Premium Rs 15000. WhatsApp: 03039929254.
- Never invent prices or products. If you do not know something, say so honestly.`;

const MAX_MESSAGES = 10;
const MAX_MSG_CHARS = 500;
const MAX_TOTAL_CHARS = 4000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "method_not_allowed", message: "Sirf POST allowed hai." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "assistant_not_configured",
      message: "Assistant abhi tayyar nahi, thodi der baad try karo.",
    });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const incoming = Array.isArray(body && body.messages) ? body.messages : [];
  const cleaned = incoming
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MSG_CHARS) }))
    .slice(-MAX_MESSAGES);

  let total = 0;
  const capped = [];
  for (const m of cleaned) {
    if (total + m.content.length > MAX_TOTAL_CHARS) break;
    total += m.content.length;
    capped.push(m);
  }

  if (capped.length === 0 || capped[capped.length - 1].role !== "user") {
    return res.status(400).json({
      error: "bad_request",
      message: "Koi sawal nahi mila. Dobara try karo.",
    });
  }

  const contents = capped.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const r = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
      }),
    });

    const data = await r.json().catch(() => null);

    if (!r.ok) {
      if (r.status === 429 || r.status === 403) {
        return res.status(502).json({
          error: "quota_exceeded",
          message: "Quota khatam ho gaya hai, thodi der baad try karo.",
        });
      }
      return res.status(502).json({
        error: "assistant_error",
        message: "Kuch ghalat ho gaya, dobara try karo.",
      });
    }

    const reply = (data && data.candidates && data.candidates[0] &&
      data.candidates[0].content && data.candidates[0].content.parts
      ? data.candidates[0].content.parts
      : []
    )
      .map((p) => p.text || "")
      .join("")
      .trim();

    if (!reply) {
      return res.status(502).json({
        error: "assistant_error",
        message: "Koi jawab nahi mila, dobara try karo.",
      });
    }

    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(502).json({
      error: "assistant_error",
      message: "Kuch ghalat ho gaya, dobara try karo.",
    });
  }
}

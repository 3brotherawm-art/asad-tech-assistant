import { useEffect, useRef, useState } from "react";

const QUICK_CHIPS = [
  "Ek kahani sunao",
  "Business idea do",
  "English seekhna hai",
  "Maths samjhao",
];

const MAX_MSG_CHARS = 500;
const MAX_HISTORY = 10;

function friendlyError(data, status) {
  if (data && data.error === "assistant_not_configured") {
    return "Assistant abhi tayyar nahi, thodi der baad try karo.";
  }
  if (data && data.error === "quota_exceeded") {
    return "Quota khatam ho gaya hai, thodi der baad try karo.";
  }
  if (data && data.message) return data.message;
  if (status === 503) return "Assistant abhi tayyar nahi, thodi der baad try karo.";
  return "Kuch ghalat ho gaya, dobara try karo.";
}

function DiamondMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#1e1b4b" />
      <path d="M32 10 L50 32 L32 54 L14 32 Z" fill="url(#logo-g)" />
      <path d="M32 19 L43 32 L32 45 L21 32 Z" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Assalam-o-Alaikum! Main Asad Tech Assistant hoon. Kuch bhi poocho — sawal, seekhna, business idea, ya likhna. Batao, kya madad karun?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(text) {
    const clean = (text || "").trim().slice(0, MAX_MSG_CHARS);
    if (!clean || sending) return;

    const next = [...messages, { role: "user", content: clean }].slice(
      -MAX_HISTORY * 2
    );
    setMessages(next);
    setInput("");
    setSending(true);

    const payload = next.slice(-MAX_HISTORY).map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_MSG_CHARS),
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: friendlyError(data, res.status), isError: true },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Kuch ghalat ho gaya, dobara try karo.",
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <DiamondMark />
          <div className="header-text">
            <h1>Asad Tech Assistant</h1>
            <p>Kuch bhi poocho — Asad Tech ka AI Assistant</p>
          </div>
          <span className="live-badge">● Live</span>
        </div>
      </header>

      <main className="chat">
        <div className="chat-inner">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`bubble-row ${m.role === "user" ? "user" : "assistant"}`}
            >
              <div className={`bubble ${m.isError ? "error" : ""}`}>{m.content}</div>
            </div>
          ))}

          {sending && (
            <div className="bubble-row assistant">
              <div className="bubble typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <div className="composer-wrap">
        <div className="chips">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className="chip"
              disabled={sending}
              onClick={() => sendMessage(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            maxLength={MAX_MSG_CHARS}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Kuch bhi poocho..."
            aria-label="Apna sawal likho"
            disabled={sending}
          />
          <button type="submit" disabled={sending || !input.trim()}>
            {sending ? "..." : "Bhejo"}
          </button>
        </form>

        <footer className="footer">
          Made by Asad Tech • AI kabhi kabhi ghalti kar sakta hai
        </footer>
      </div>
    </div>
  );
}

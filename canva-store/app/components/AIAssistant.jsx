"use client";
import { useState, useRef } from "react";
import styles from "./store.module.css";

// Rule-based demo assistant - matches keywords, not a live language model.
// Swap the body of getBotReply for a real API call when you're ready to wire
// this up to an actual LLM.
function getBotReply(raw, products, categories, setActiveCategory) {
  const text = raw.toLowerCase();

  const matchedCat = categories.find((c) => text.includes(c.toLowerCase()));
  if (matchedCat) {
    const matches = products.filter((p) => p.category === matchedCat);
    if (matches.length) {
      const list = matches
        .map((p) => `${p.title} (₹${(p.priceInr / 100).toFixed(0)} / $${(p.priceUsd / 100).toFixed(2)})`)
        .join(", ");
      setActiveCategory(matchedCat);
      return `Here's what we have in ${matchedCat}: ${list}. I've filtered the shop for you too.`;
    }
  }

  if (/refund|return|money back/.test(text))
    return "Digital downloads are non-refundable once delivered, but if a file is broken or wrong, reply with your order email and we'll fix it.";
  if (/upi|gpay|phonepe|paytm|payment|pay\b|card|paypal/.test(text))
    return "We accept UPI (Google Pay, PhonePe, Paytm) for Indian customers, and cards or PayPal for international orders - both are on every product page.";
  if (/deliver|download|email|link/.test(text))
    return "Delivery is automatic - right after payment clears, we email your download link.";
  if (/canva|edit|customi[sz]e/.test(text))
    return "Every template opens directly in Canva - click the link in your delivery email, hit \"Edit\", and it copies into your own Canva account.";
  if (/admin|login|dashboard/.test(text))
    return "That's the store owner's side of things - is there a template I can help you find instead?";
  if (/hi|hello|hey/.test(text))
    return "Hey! I can help you find a template, or answer questions about payment, delivery, and editing in Canva. What are you working on?";
  if (/price|cost|how much/.test(text))
    return `Prices vary by template. Tell me a category${categories.length ? ` - like ${categories.slice(0, 3).join(", ")}` : ""} - and I'll pull up options.`;

  return `I can help you find templates${categories.length ? ` (try a category like ${categories.slice(0, 4).join(", ")})` : ""} or answer questions about payment, delivery, or editing in Canva.`;
}

const SpeechRecognitionAPI =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

function startRecognition(onResult, onEnd, onUnsupported) {
  if (!SpeechRecognitionAPI) {
    onUnsupported && onUnsupported();
    return null;
  }
  const rec = new SpeechRecognitionAPI();
  rec.lang = "en-US";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => onResult(e.results[0][0].transcript);
  rec.onerror = () => onEnd && onEnd();
  rec.onend = () => onEnd && onEnd();
  rec.start();
  return rec;
}

export default function AIAssistant({ products, categories, setActiveCategory }) {
  // ---- chat state ----
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! Ask me about a category, payment, or how delivery works." },
  ]);
  const [input, setInput] = useState("");
  const [chatListening, setChatListening] = useState(false);
  const chatRecRef = useRef(null);
  const chatBodyRef = useRef(null);

  const suggestions = ["What payment methods do you accept?", "How does delivery work?"];

  function pushMessage(sender, text) {
    setMessages((m) => [...m, { sender, text }]);
    setTimeout(() => {
      if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }, 0);
  }

  function sendChat(preset) {
    const text = (typeof preset === "string" ? preset : input).trim();
    if (!text) return;
    pushMessage("user", text);
    setInput("");
    setTimeout(() => pushMessage("bot", getBotReply(text, products, categories, setActiveCategory)), 300);
  }

  function chatMicToggle() {
    if (chatRecRef.current) {
      chatRecRef.current.stop();
      return;
    }
    setChatListening(true);
    chatRecRef.current = startRecognition(
      (transcript) => {
        setInput(transcript);
        setTimeout(() => sendChat(transcript), 0);
      },
      () => {
        setChatListening(false);
        chatRecRef.current = null;
      },
      () => {
        setChatListening(false);
        alert("Voice input isn't supported in this browser - try Chrome.");
      }
    );
  }

  // ---- voice agent state ----
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Tap the mic and ask about a template");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceReply, setVoiceReply] = useState("");
  const voiceRecRef = useRef(null);

  function closeVoice() {
    setVoiceOpen(false);
    if (voiceRecRef.current) voiceRecRef.current.stop();
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    setVoiceListening(false);
    setVoiceStatus("Tap the mic and ask about a template");
  }

  function voiceCircleTap() {
    if (voiceRecRef.current) {
      voiceRecRef.current.stop();
      return;
    }
    setVoiceTranscript("");
    setVoiceReply("");
    setVoiceListening(true);
    setVoiceStatus("Listening...");

    voiceRecRef.current = startRecognition(
      (transcript) => {
        setVoiceTranscript(`"${transcript}"`);
        setVoiceStatus("Thinking...");
        const reply = getBotReply(transcript, products, categories, setActiveCategory);
        setVoiceReply(reply);
        setVoiceStatus("Speaking...");
        const utter = new SpeechSynthesisUtterance(reply);
        utter.onend = () => setVoiceStatus("Tap the mic to ask something else");
        window.speechSynthesis.speak(utter);
      },
      () => {
        setVoiceListening(false);
        voiceRecRef.current = null;
      },
      () => {
        setVoiceListening(false);
        setVoiceStatus("Voice input isn't supported in this browser - try Chrome.");
      }
    );
  }

  return (
    <>
      <button className={styles.chatFab} onClick={() => setChatOpen((v) => !v)} aria-label="Open chat">💬</button>
      <div className={`${styles.chatPanel} ${chatOpen ? styles.chatPanelOpen : ""}`}>
        <div className={styles.chatHead}>
          <div>
            <div className={styles.chatTitle}>Assistant</div>
            <div className={styles.chatSub}>Demo AI - rule-based, not a live model</div>
          </div>
          <button onClick={() => setChatOpen(false)} aria-label="Close chat">✕</button>
        </div>
        <div className={styles.chatBody} ref={chatBodyRef}>
          {messages.map((m, i) => (
            <div key={i} className={`${styles.msg} ${m.sender === "bot" ? styles.msgBot : styles.msgUser}`}>
              {m.text}
            </div>
          ))}
        </div>
        <div className={styles.suggestions}>
          {suggestions.map((s) => (
            <button key={s} onClick={() => sendChat(s)}>{s}</button>
          ))}
        </div>
        <div className={styles.chatInputRow}>
          <button
            className={`${styles.micBtn} ${chatListening ? styles.micBtnListening : ""}`}
            onClick={chatMicToggle}
            aria-label="Voice input"
          >
            🎤
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="Ask about templates, payment, delivery..."
          />
          <button className={styles.sendBtn} onClick={() => sendChat()} aria-label="Send">➤</button>
        </div>
      </div>

      <button className={styles.voiceFab} onClick={() => setVoiceOpen(true)} aria-label="Talk to voice agent">🎙️</button>
      <div className={`${styles.voiceOverlay} ${voiceOpen ? styles.voiceOverlayOpen : ""}`}>
        <button className={styles.voiceClose} onClick={closeVoice} aria-label="Close voice agent">✕</button>
        <div className={styles.voiceCircle} onClick={voiceCircleTap}>🎙️</div>
        <div className={styles.voiceStatus}>{voiceStatus}</div>
        <div className={styles.voiceTranscript}>{voiceTranscript}</div>
        <div className={styles.voiceReply}>{voiceReply}</div>
        <div className={styles.voiceHint}>Voice powered by your browser's built-in speech recognition - demo logic, not a live AI model</div>
      </div>
    </>
  );
}

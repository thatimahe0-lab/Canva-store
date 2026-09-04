"use client";
import { useState } from "react";

export default function ShareButton({ url, title, text }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* user cancelled - ignore */
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="btn btn-secondary" onClick={handleShare}>
      {copied ? "Link copied!" : "🔗 Share"}
    </button>
  );
}

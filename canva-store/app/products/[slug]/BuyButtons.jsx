"use client";
import { useState } from "react";

export default function BuyButtons({ productId }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function payWithStripe() {
    if (!email) return setError("Enter your email first - that's where the download link goes.");
    setLoading(true);
    setError("");
    const res = await fetch("/api/checkout/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, email }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.url) window.location.href = data.url;
    else setError(data.error || "Something went wrong.");
  }

  async function payWithRazorpay() {
    if (!email) return setError("Enter your email first - that's where the download link goes.");
    setLoading(true);
    setError("");
    const res = await fetch("/api/checkout/razorpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, email }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) return setError(data.error);

    // Razorpay Checkout.js (loaded once, globally, see app/layout.js script tag
    // in a production build; kept inline here for clarity)
    const options = {
      key: data.keyId,
      amount: data.amount,
      currency: "INR",
      name: "TemplateHaus",
      description: data.productTitle,
      order_id: data.orderId,
      prefill: { email },
      handler: function () {
        window.location.href = `/order-confirmation?ref=${data.orderId}`;
      },
      theme: { color: "#111111" },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  return (
    <div>
      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10, borderRadius: 8, border: "1px solid #ddd" }}
      />
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={payWithRazorpay} disabled={loading}>
          Pay via UPI / GPay / PhonePe / Paytm
        </button>
        <button className="btn btn-secondary" onClick={payWithStripe} disabled={loading}>
          Pay via Card / PayPal (international)
        </button>
      </div>

      {/* Razorpay's checkout script - safe to load globally */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
    </div>
  );
}

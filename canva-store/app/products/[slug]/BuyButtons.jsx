"use client";
import { useState } from "react";
import Script from "next/script";

export default function BuyButtons({ productId }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [razorpayReady, setRazorpayReady] = useState(false);

  async function payWithStripe() {
    if (!email) return setError("Enter your email first - that's where the download link goes.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.url) window.location.href = data.url;
      else setError(data.error || "Something went wrong.");
    } catch (err) {
      setLoading(false);
      setError(err.message || "Network error - please try again.");
    }
  }

  async function payWithRazorpay() {
    if (!email) return setError("Enter your email first - that's where the download link goes.");
    if (!razorpayReady || typeof window.Razorpay === "undefined") {
      return setError("Payment is still loading - please wait a second and try again.");
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.error) return setError(data.error);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "TemplateTreasury",
        description: data.productTitle,
        order_id: data.orderId,
        prefill: { email },
        handler: function () {
          window.location.href = `/order-confirmation?ref=${data.orderId}`;
        },
        modal: {
          ondismiss: function () {
            setError("Payment window closed before completing.");
          },
        },
        theme: { color: "#111111" },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        setError(resp.error?.description || "Payment failed - please try again.");
      });
      rzp.open();
    } catch (err) {
      setLoading(false);
      setError(err.message || "Could not open payment window - please try again.");
    }
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
          {razorpayReady ? "Pay via UPI / GPay / PhonePe / Paytm" : "Loading UPI payment..."}
        </button>
        <button className="btn btn-secondary" onClick={payWithStripe} disabled={loading}>
          Pay via Card / PayPal (international)
        </button>
      </div>

      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayReady(true)}
        onError={() => setError("Could not load the payment system - check your connection and refresh.")}
      />
    </div>
  );
}

export default function OrderConfirmation() {
  return (
    <main className="container" style={{ padding: 40, textAlign: "center" }}>
      <h1>🎉 Thank you!</h1>
      <p>
        Your payment is being confirmed. Your download link is on its way to your inbox -
        it usually arrives within a minute.
      </p>
      <a href="/" className="btn btn-primary">Back to shop</a>
    </main>
  );
}

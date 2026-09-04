import "./globals.css";

export const metadata = {
  title: "TemplateHaus – Canva Templates for Creators",
  description: "Beautiful, ready-to-edit Canva templates. Instant digital download.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

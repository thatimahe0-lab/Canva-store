import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendDownloadEmail({ to, productTitle, downloadToken }) {
  const link = `${process.env.NEXT_PUBLIC_SITE_URL}/api/download/${downloadToken}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Your download: ${productTitle}`,
    html: `
      <p>Thanks for your purchase!</p>
      <p><strong>${productTitle}</strong> is ready to download:</p>
      <p><a href="${link}" style="display:inline-block;padding:10px 18px;background:#111;color:#fff;
        border-radius:8px;text-decoration:none;">Download your template</a></p>
      <p style="color:#888;font-size:12px;">This link is personal to your order - please don't share it.</p>
    `,
  });
}

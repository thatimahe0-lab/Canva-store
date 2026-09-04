import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

// Works with any S3-compatible provider - Cloudflare R2, Supabase Storage,
// Backblaze B2, or plain AWS S3. R2 is the natural pick alongside Netlify:
// no egress fees and a generous free tier.
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

// Cover images: public bucket, fronted by a CDN URL - these need to be
// publicly reachable so they render on product cards and social share previews.
export async function uploadPublicFile(buffer, key, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_PUBLIC,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return `${process.env.S3_PUBLIC_URL_BASE}/${key}`;
}

// Template files: private bucket. Never given a public URL - only ever
// read server-side, after /api/download/[token] confirms the order is paid.
export async function uploadPrivateFile(buffer, key, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_PRIVATE,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return key;
}

export async function getPrivateFileBuffer(key) {
  const result = await s3.send(
    new GetObjectCommand({ Bucket: process.env.S3_BUCKET_PRIVATE, Key: key })
  );
  const chunks = [];
  for await (const chunk of result.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

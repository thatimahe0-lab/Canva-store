import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";

// Works with any S3-compatible provider - Cloudflare R2, Supabase Storage,
// Backblaze B2, or plain AWS S3. R2 is the natural pick alongside Netlify:
// no egress fees and a generous free tier.
const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true, // required for Supabase Storage (and harmless for R2/S3)
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  // Fail fast instead of hanging indefinitely if the storage endpoint is
  // unreachable or misconfigured - a slow/broken connection now surfaces as
  // a clear error within ~15s rather than a request that never resolves.
  maxAttempts: 2,
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 5000,
    socketTimeout: 15000,
  }),
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

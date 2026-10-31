import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Signing a URL happens locally with no network call, so it can't hang or
// time out. The customer's browser then downloads straight from storage.
const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

export async function getPresignedDownloadUrl(key) {
  const command = new GetObjectCommand({ Bucket: process.env.S3_BUCKET_PRIVATE, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 300 }); // valid for 5 minutes
}

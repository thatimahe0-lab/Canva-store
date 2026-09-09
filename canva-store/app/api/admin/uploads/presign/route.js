import { requireAdmin } from "@/lib/require-admin";
import { getPresignedUploadUrl } from "@/lib/storage";

export async function POST(req) {
  const unauthorized = requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { key, contentType, target } = await req.json();

    if (!key || !contentType || (target !== "public" && target !== "private")) {
      return Response.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    const uploadUrl = await getPresignedUploadUrl(target, key, contentType);
    const publicUrl = target === "public" ? `${process.env.S3_PUBLIC_URL_BASE}/${key}` : null;

    return Response.json({ uploadUrl, publicUrl });
  } catch (err) {
    console.error("Presign failed:", err);
    return Response.json(
      { error: `Could not create upload URL: ${err.message || "unknown error"}` },
      { status: 500 }
    );
  }
}

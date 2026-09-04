import { nanoid } from "nanoid";

// A download token is just an opaque random ID stored against the Order row.
// It's unguessable and single-purpose (unlike re-using the payment ID),
// and we can expire/rate-limit it independently of the payment provider.
export function generateDownloadToken() {
  return nanoid(32);
}

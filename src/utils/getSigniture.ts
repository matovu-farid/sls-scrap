import crypto from "crypto";
import { canonicalize } from "json-canonicalize";

export function hash(data: Object) {
  return crypto.createHash("sha256").update(canonicalize(data)).digest("hex");
}
export function getSigniture(data: Object, secret: string, timestamp: string) {
  console.log({ hash: hash(data), secret, timestamp });
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${hash(data)}`)
    .digest("hex");
}

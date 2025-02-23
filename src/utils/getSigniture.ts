import crypto from "crypto";
export function getSigniture(data: string, secret: string, timestamp: string) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${data}`)
    .digest("hex");
}

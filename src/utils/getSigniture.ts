import crypto from "crypto";
export function getSigniture(data: any, secret: string) {
  const timestamp = new Date().toISOString();
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${data}`)
    .digest("hex");
}

import { normalize } from "./normalize";

export function getHost(url: string) {
  const parsedURL = new URL(normalize(url));
  return parsedURL.host;
}

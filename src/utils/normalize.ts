import normalizeUrl from "normalize-url";

export function normalize(url: string) {
  return normalizeUrl(url, {
    stripHash: true,
    removeDirectoryIndex: true,
    removeTrailingSlash: true,
  });
}

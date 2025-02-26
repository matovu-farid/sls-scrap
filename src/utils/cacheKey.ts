import { hash } from "./getSigniture";

export const createCacheKey = (signSecret: string, id: string) => {
  return hash(signSecret + id);
};

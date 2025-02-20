import { HostData, hostDataSchema } from "@/schemas/hostdata";
import { syncSetCache } from "./syncSetCache";
import { getCache } from "@/entites/cache";

export function updateHostDataInCache(
  host: string,
  updateFunction: (currentValue: HostData) => Partial<HostData>,
  shouldUpdate?: (currentValue: HostData) => boolean
) {
  return syncSetCache<HostData>(
    host,
    async () => {
      const defaultHostData: HostData = {
        stage: "explore",
        count: 0,
        explored: 0,
        links: [],
        scraped: false,
        signSecret: "",
        callbackUrl: "",
      };
      const currentValue =
        (await getCache<HostData>(host, hostDataSchema)) || defaultHostData;

      if (shouldUpdate && !shouldUpdate(currentValue)) {
        return null;
      }
      return { ...currentValue, ...updateFunction(currentValue) };
    },
    host
  );
}

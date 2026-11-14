import "server-only";

import { unstable_cache } from "next/cache";

/** Cache shared, non-personal database reads briefly to reduce repeat queries. */
export function cacheDatabaseRead<T>(
  key: string,
  query: () => Promise<T>,
  revalidateSeconds = 60,
) {
  return unstable_cache(query, ["database-read", key], {
    revalidate: revalidateSeconds,
    tags: [`database:${key}`],
  })();
}

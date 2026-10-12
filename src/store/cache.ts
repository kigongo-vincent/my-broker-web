import { get, set, del } from "idb-keyval";
import type {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";

const KEY = "my-broker-query-cache";
const MAX_CACHED_PAGES = 3;

// An infinite query refetches EVERY loaded page, so only keep the first few
const trim = (client: PersistedClient): PersistedClient => ({
  ...client,
  clientState: {
    ...client.clientState,
    queries: client.clientState.queries.map((query) => {
      const data = query.state.data as
        | { pages?: unknown[]; pageParams?: unknown[] }
        | undefined;
      if (!Array.isArray(data?.pages)) return query;
      return {
        ...query,
        state: {
          ...query.state,
          data: {
            ...data,
            pages: data.pages.slice(0, MAX_CACHED_PAGES),
            pageParams: data.pageParams?.slice(0, MAX_CACHED_PAGES),
          },
        },
      };
    }),
  },
});

export const queryPersister: Persister = {
  persistClient: async (client) => {
    await set(KEY, trim(client));
  },
  restoreClient: async () => await get<PersistedClient>(KEY),
  removeClient: async () => {
    await del(KEY);
  },
};
import { Get, Post, type APIResponse } from "../../api";
import type { PostI } from "../components/pages/tabs/Post";
import type { UserI } from "../store/auth";

export type FeedSource = "backend" | "tiktok";

export interface FeedFilter {
  column: string;
  operator: string;
  value: unknown;
  label?: string;
}

export interface FeedRequest {
  page: number;
  limit: number;
  search?: string;
  filters?: FeedFilter[];
}

export interface FeedPagination {
  page: number;
  limit: number;
  /** Sum of matches across every source that answered. */
  total: number;
  totalPages?: number;
  /** True when at least one source still has a next page. */
  hasMore?: boolean;
}

export interface FeedPage {
  data: PostI[];
  pagination: FeedPagination;
  /**
   * Set only when the page came from one specific source (details / profile
   * style calls). Merged pages leave it undefined so every following page
   * queries all eligible sources again.
   */
  source?: FeedSource;
  /** Sources that contributed to this page. */
  sources: FeedSource[];
}

export interface ProfilePage {
  user: Partial<UserI>;
  posts: PostI[];
  pagination: FeedPagination;
}

interface FeedAPIRequest {
  pagination: {
    limit: number;
    page: number;
  };
  search?: string;
  columns?: FeedFilter[];
}

interface SourceConfig {
  id: FeedSource;
  enabled: boolean;
  supportsSearch: boolean;
  url?: string;
}

const MAX_MAP_PAGES = 50;

const scraperFilterOperators: Record<string, string[]> = {
  location: ["within_radius"],
  "(price->>'amount')::numeric": ["eq", "gte", "lte"],
  type: ["eq"],
  bedrooms: ["eq", "gte"],
  bathrooms: ["eq", "gte"],
  toilets: ["eq", "gte"],
  negotiable: ["eq"],
};

function envEnabled(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  throw new Error("Feed source environment values must be 'true' or 'false'.");
}

function filtersSupportedByTikTok(filters: FeedFilter[]): boolean {
  return filters.every((filter) =>
    scraperFilterOperators[filter.column]?.includes(filter.operator)
  );
}

function normalizeBaseUrl(url: string | undefined, sourceName: string): string {
  const normalized = url?.trim().replace(/\/+$/, "");
  if (!normalized) {
    throw new Error(
      `${sourceName} feed is enabled but its API URL is not set.`
    );
  }
  return normalized;
}

function readSources(): SourceConfig[] {
  const backendEnabled = envEnabled(
    import.meta.env.VITE_FEED_BACKEND_ENABLED,
    true
  );
  const tiktokEnabled = envEnabled(
    import.meta.env.VITE_FEED_TIKTOK_ENABLED,
    false
  );

  return [
    {
      id: "backend",
      enabled: backendEnabled,
      supportsSearch: true,
      url: import.meta.env.VITE_API_URL,
    },
    {
      id: "tiktok",
      enabled: tiktokEnabled,
      // The scraper API maps `search` to a place-name substring match.
      // Requires the updated Go API to be deployed.
      supportsSearch: true,
      url: import.meta.env.VITE_TIKTOK_API_URL,
    },
  ];
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function toFiniteNumber(value: unknown): number | undefined {
  const n =
    typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
  }
  return undefined;
}

/**
 * Finds a post's coordinates regardless of which source shaped it.
 * The backend uses `location.cordinates.{lat,lon}`; the scraper API may use
 * `coordinates`, `latitude/longitude`, or put them at the top level.
 */
function readCoordinates(post: PostI): { lat: number; lon: number } | null {
  const root = post as unknown as Record<string, unknown>;
  const location = (root.location ?? {}) as Record<string, unknown>;
  const candidates: unknown[] = [
    location.cordinates,
    location.coordinates,
    location.Coordinates,
    location.Cordinates,
    location,
    root.coordinates,
    root,
  ];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const c = candidate as Record<string, unknown>;
    const lat = toFiniteNumber(pick(c, ["lat", "Lat", "latitude", "Latitude"]));
    const lon = toFiniteNumber(
      pick(c, ["lon", "Lon", "lng", "long", "longitude", "Longitude"])
    );
    if (lat !== undefined && lon !== undefined) return { lat, lon };
  }
  return null;
}

function normalizePosts(posts: PostI[], source: FeedSource): PostI[] {
  return posts.map((post) => {
    const coords = source === "tiktok" ? readCoordinates(post) : null;
    return {
      ...post,
      source,
      ...(coords
        ? {
            location: {
              ...post.location,
              cordinates: coords,
            } as PostI["location"],
          }
        : {}),
      author: {
        ...post.author,
        source,
        ...(source === "tiktok"
          ? { username: post.author?.username || post.author?.name }
          : {}),
      },
    };
  });
}

function validateResponse<T>(
  response: APIResponse<T>,
  source: FeedSource,
  description: string
): void {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      response.error ||
        response.msg ||
        `${source} ${description} failed with status ${response.status}.`
    );
  }
}

/** Alternate items from each list so no single source dominates a page. */
function interleave<T>(lists: T[][]): T[] {
  const result: T[] = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      if (i < list.length) result.push(list[i]);
    }
  }
  return result;
}

/** Combine one page from each source into a single feed page. */
function mergePages(pages: FeedPage[], request: FeedRequest): FeedPage {
  return {
    data: interleave(pages.map((page) => page.data)),
    pagination: {
      page: request.page,
      limit: request.limit,
      total: pages.reduce((sum, page) => sum + page.pagination.total, 0),
      totalPages: Math.max(
        ...pages.map(
          (page) =>
            page.pagination.totalPages ??
            Math.ceil(page.pagination.total / page.pagination.limit)
        )
      ),
      hasMore: pages.some((page) => page.pagination.hasMore),
    },
    sources: pages.flatMap((page) => page.sources),
  };
}

export function createFeedFactory() {
  const getEligibleSources = (request: FeedRequest): SourceConfig[] => {
    const search = request.search?.trim();
    const skip = (id: FeedSource, reason: string) => {
      if (import.meta.env.DEV) console.info(`[feed] ${id} skipped: ${reason}`);
      return false;
    };
    return readSources()
      .filter((source) => {
        if (!source.enabled) {
          return skip(
            source.id,
            `disabled (VITE_FEED_${source.id.toUpperCase()}_ENABLED)`
          );
        }
        if (search && !source.supportsSearch) {
          return skip(source.id, "does not support text search");
        }
        if (
          source.id === "tiktok" &&
          !filtersSupportedByTikTok(request.filters ?? [])
        ) {
          return skip(
            source.id,
            "active filters not supported by the scraper API"
          );
        }
        return true;
      })
      .map((source) => ({
        ...source,
        url: normalizeBaseUrl(
          source.url,
          source.id === "tiktok" ? "TikTok" : "Backend"
        ),
      }));
  };

  const fetchFromSource = async (
    source: SourceConfig,
    request: FeedRequest
  ): Promise<FeedPage> => {
    const payload: FeedAPIRequest = {
      pagination: { limit: request.limit, page: request.page },
      ...(request.filters?.length ? { columns: request.filters } : {}),
      ...(request.search?.trim() ? { search: request.search.trim() } : {}),
    };
    const path = source.id === "backend" ? "posts/feed" : "properties";
    const response: APIResponse<PostI[]> = await Post<FeedAPIRequest, PostI[]>(
      path,
      payload,
      source.url,
      {
        includeAuth: source.id === "backend",
        notifyErrors: false,
      }
    );

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        response.error ||
          response.msg ||
          `${source.id} feed request failed with status ${response.status}.`
      );
    }
    if (!Array.isArray(response.data)) {
      throw new Error(`${source.id} feed returned an invalid posts list.`);
    }

    const pagination = response.pagination;
    if (
      !pagination ||
      !Number.isFinite(pagination.page) ||
      !Number.isFinite(pagination.limit) ||
      !Number.isFinite(pagination.total)
    ) {
      throw new Error(`${source.id} feed returned invalid pagination data.`);
    }

    return {
      data: normalizePosts(response.data, source.id),
      pagination: {
        ...pagination,
        hasMore: pagination.page * pagination.limit < pagination.total,
      },
      source: source.id,
      sources: [source.id],
    };
  };

  return {
    /**
     * Queries EVERY eligible source in parallel and merges the results.
     * A source that fails is skipped (logged) as long as at least one
     * source succeeds. Pass `preferredSource` to force a single source.
     */
    async fetchPage(
      request: FeedRequest,
      preferredSource?: FeedSource
    ): Promise<FeedPage> {
      const candidates = getEligibleSources(request);

      if (preferredSource) {
        const source = candidates.find(({ id }) => id === preferredSource);
        if (!source) {
          throw new Error(
            `${preferredSource} cannot serve this feed request or is disabled.`
          );
        }
        return fetchFromSource(source, request);
      }

      if (candidates.length === 0) {
        if (request.search?.trim()) {
          throw new Error(
            "No enabled feed source can serve this search. Enable VITE_FEED_BACKEND_ENABLED or VITE_FEED_TIKTOK_ENABLED, and make sure the active filters are supported."
          );
        }
        throw new Error(
          "No enabled feed source supports these filters. Enable the backend or a compatible TikTok feed source."
        );
      }

      // Split the page size so a merged page stays close to `limit` items.
      const perSourceLimit = Math.max(
        1,
        Math.ceil(request.limit / candidates.length)
      );
      const settled = await Promise.allSettled(
        candidates.map((source) =>
          fetchFromSource(source, { ...request, limit: perSourceLimit })
        )
      );

      const pages: FeedPage[] = [];
      const failures: Error[] = [];
      settled.forEach((result, index) => {
        if (result.status === "fulfilled") {
          pages.push(result.value);
        } else {
          const error = asError(result.reason);
          failures.push(error);
          console.warn(`[feed] ${candidates[index].id} failed:`, error.message);
        }
      });

      if (pages.length === 0) {
        throw new Error(
          `All eligible feed sources failed: ${failures
            .map((failure) => failure.message)
            .join("; ")}`
        );
      }

      return mergePages(pages, request);
    },
    async fetchPostDetails(
      id: string,
      source: FeedSource = "backend"
    ): Promise<PostI> {
      const config = readSources().find(
        ({ id: sourceId }) => sourceId === source
      );
      if (!config?.enabled) {
        throw new Error(`${source} feed source is disabled.`);
      }
      const url = normalizeBaseUrl(
        config.url,
        source === "tiktok" ? "TikTok" : "Backend"
      );
      const path =
        source === "tiktok"
          ? `properties/${encodeURIComponent(id)}`
          : `posts/post/${encodeURIComponent(id)}`;
      const response = await Get<PostI>(path, url, {
        includeAuth: source === "backend",
        notifyErrors: false,
      });
      validateResponse(response, source, "post details");
      if (!response.data || typeof response.data !== "object") {
        throw new Error(`${source} returned invalid post details.`);
      }
      return normalizePosts([response.data], source)[0];
    },
    async fetchProfilePage(
      usernameOrId: string,
      page: number,
      limit: number,
      source: FeedSource
    ): Promise<ProfilePage> {
      const config = readSources().find(({ id }) => id === source);
      if (!config?.enabled) {
        throw new Error(`${source} feed source is disabled.`);
      }
      const url = normalizeBaseUrl(
        config.url,
        source === "tiktok" ? "TikTok" : "Backend"
      );

      if (source === "backend") {
        const response = await Post<
          FeedAPIRequest,
          { user: Partial<UserI>; posts: PostI[] }
        >(
          `posts/user/${encodeURIComponent(usernameOrId)}`,
          { pagination: { page, limit } },
          url,
          { notifyErrors: false }
        );
        validateResponse(response, source, "profile");
        if (!response.data || !Array.isArray(response.data.posts)) {
          throw new Error("Backend returned invalid profile data.");
        }
        const pagination = response.pagination;
        if (!pagination) {
          throw new Error("Backend returned invalid profile pagination.");
        }
        return {
          user: response.data.user,
          posts: normalizePosts(response.data.posts, source),
          pagination,
        };
      }

      const response = await Get<PostI[]>(
        `properties/user/${encodeURIComponent(
          usernameOrId
        )}?page=${page}&limit=${limit}`,
        url,
        { notifyErrors: false }
      );
      validateResponse(response, source, "profile");
      if (!Array.isArray(response.data)) {
        throw new Error("TikTok scraper returned invalid profile posts.");
      }
      const posts = normalizePosts(response.data, source);
      const author = posts[0]?.author;
      const pagination = response.pagination;
      if (!pagination) {
        throw new Error("TikTok scraper returned invalid profile pagination.");
      }
      return {
        user: author ?? {
          name: usernameOrId.replace(/^@/, ""),
          username: usernameOrId.replace(/^@/, ""),
          source,
        },
        posts,
        pagination,
      };
    },
    /** Changes whenever the enabled sources change; use it in query keys. */
    activeSourceKey(): string {
      return readSources()
        .filter((source) => source.enabled)
        .map((source) => source.id)
        .join(",");
    },
    /**
     * Loads map pins from every eligible source. Each source is paged on its
     * own, so one source failing or running out never affects another.
     */
    async fetchMapData(): Promise<PostI[]> {
      const sources = getEligibleSources({ page: 1, limit: 100 });
      if (sources.length === 0) {
        throw new Error("No enabled feed source is available for map data.");
      }

      const settled = await Promise.allSettled(
        sources.map(async (source) => {
          const posts: PostI[] = [];
          for (let page = 1; page <= MAX_MAP_PAGES; page++) {
            const current = await fetchFromSource(source, { page, limit: 100 });
            posts.push(...current.data);
            if (!current.pagination.hasMore) break;
          }
          return posts;
        })
      );

      const results: PostI[] = [];
      const failures: Error[] = [];
      settled.forEach((result, index) => {
        const id = sources[index].id;
        if (result.status === "fulfilled") {
          const plotted = result.value.filter(hasMapCoordinates);
          if (import.meta.env.DEV) {
            console.info(
              `[feed] map: ${id} returned ${result.value.length}, plotted ${plotted.length}`
            );
          }
          results.push(...plotted);
        } else {
          const error = asError(result.reason);
          failures.push(error);
          console.warn(`[feed] map: ${id} failed:`, error.message);
        }
      });

      if (failures.length === sources.length) {
        throw new Error(
          `All map sources failed: ${failures.map((f) => f.message).join("; ")}`
        );
      }
      return results;
    },
  };
}

function hasMapCoordinates(post: PostI): boolean {
  const coords = readCoordinates(post);
  if (!coords) return false;
  const { lat, lon } = coords;
  return (
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180 &&
    !(lat === 0 && lon === 0)
  );
}

export const feedFactory = createFeedFactory();

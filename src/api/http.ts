import { useUserStore } from '../store/auth';

import { decodeEnvelopeBuffer } from './decode-envelope';
import { env } from './env';
import { FB_CONTENT_TYPE } from './fb-request-env';

export * from './fb-request-env';

export const BASE_URL = env.apiUrl;
export const BASE_URL_CHAT = env.chatWsUrl;

const normalizeWsBase = (raw: string) => {
  if (!raw) return 'ws://localhost:3000';
  if (raw.startsWith('ws://') || raw.startsWith('wss://')) {
    return raw.replace(/\/+$/, '');
  }
  if (raw.startsWith('https://')) {
    return raw.replace(/^https:\/\//, 'wss://').replace(/\/+$/, '');
  }
  if (raw.startsWith('http://')) {
    return raw.replace(/^http:\/\//, 'ws://').replace(/\/+$/, '');
  }
  return `ws://${raw.replace(/\/+$/, '')}`;
};

export const getWsUrl = (path = '/ws', params?: Record<string, string | number | undefined>) => {
  const base = normalizeWsBase(BASE_URL_CHAT);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      query.set(key, String(value));
    }
  });
  const q = query.toString();
  return `${base}${normalizedPath}${q ? `?${q}` : ''}`;
};

export interface ResponseI<T = unknown> {
  msg: string;
  content?: T | T[];
  data?: T | T[];
  limit?: number;
  /** Total rows for paged PostPage responses. */
  total?: number;
  /** Server-reported page index for PostPage payloads. */
  apiPage?: number;
  status: number;
  token?: string;
  otp?: number;
  warning?: string;
}

const LOG_TAG = '[HTTP]';

const debugLog = (...args: unknown[]) => {
  if (!env.debug) return;
  console.log(LOG_TAG, ...args);
};

const debugError = (...args: unknown[]) => {
  if (!env.debug) return;
  console.error(LOG_TAG, ...args);
};

const normalizeErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message || 'Unknown error';
  }
  return 'Unknown error';
};

const authHeader = () => ({
  Authorization: `Bearer ${useUserStore.getState().token ?? ''}`,
});

const fbAcceptHeaders = () => ({
  ...authHeader(),
  Accept: FB_CONTENT_TYPE,
});

const fbPostHeaders = () => ({
  ...authHeader(),
  Accept: FB_CONTENT_TYPE,
  'Content-Type': FB_CONTENT_TYPE,
});

const normalizeError = (status: number, fallback: string) => {
  if (status === 401) return 'Unauthorized, please login again.';
  if (status === 403) return 'Access denied for this action.';
  if (status >= 500) return 'Server error. Please try again later.';
  return fallback;
};

function toU8(body: Uint8Array | ArrayBuffer): Uint8Array {
  return body instanceof Uint8Array ? body : new Uint8Array(body);
}

function parseFlatResponse(ab: ArrayBuffer, httpStatus: number): ResponseI {
  try {
    const dec = decodeEnvelopeBuffer(ab);
    return {
      msg: dec.msg,
      content: dec.content as unknown,
      data: dec.data as unknown,
      limit: dec.limit,
      total: dec.total,
      apiPage: dec.apiPage,
      status: httpStatus,
      token: dec.token,
      otp: dec.otp,
      warning: dec.warning,
    };
  } catch {
    return {
      msg: 'Invalid response from server.',
      status: httpStatus,
    };
  }
}

/** POST with a finished `RequestEnv` payload (see `encode*` in `./fb-request-env`). */
export async function POST(path: string, body: Uint8Array | ArrayBuffer): Promise<ResponseI> {
  const startedAt = Date.now();
  const url = `${BASE_URL}/${path}`;
  try {
    const bytes = toU8(body);
    const rawBuf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    debugLog('request:start', {
      method: 'POST',
      url,
      host: BASE_URL,
      bodyBytes: bytes.byteLength,
    });
    const res = await fetch(url, {
      body: rawBuf,
      method: 'POST',
      headers: fbPostHeaders(),
    });
    const ab = await res.arrayBuffer();
    const parsed = parseFlatResponse(ab, res.status);
    if (!res.ok) {
      parsed.msg = normalizeError(res.status, parsed.msg || 'Request failed');
    }
    debugLog('request:end', {
      method: 'POST',
      url,
      status: res.status,
      ok: res.ok,
      durationMs: Date.now() - startedAt,
      response: parsed,
    });
    return parsed;
  } catch (error) {
    const message = normalizeErrorMessage(error);
    debugError('request:error', {
      method: 'POST',
      url,
      durationMs: Date.now() - startedAt,
      error: message,
    });
    return { msg: `Network error: ${message}. Check your connection.`, content: [], status: 0 };
  }
}

export interface GetRequestControls {
  page?: number;
  limit?: number;
  findAll?: boolean;
  type?: string;
  /** Posts text search (backend `query`). */
  query?: string;
  location?: string;
  startPrice?: string;
  endPrice?: string;
  isNegotiable?: boolean;
  bedrooms?: string;
  bathrooms?: string;
  toilets?: string;
}

const appendGetParam = (url: string, key: string, value: string | number | boolean): string => {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
};

export const GET = async <X = unknown>(
  path: string,
  controls?: GetRequestControls,
  /** @deprecated Prefer `controls.query`. Kept for older call sites. */
  legacyTextQuery?: string,
): Promise<ResponseI<X>> => {
  const startedAt = Date.now();
  let url = `${BASE_URL}/${path}`;
  try {
    let limit = 10;
    let page = 1;

    if (controls?.limit) limit = controls?.limit;
    if (controls?.page) page = controls?.page;

    if (!controls?.findAll) {
      url += `?page=${page}&limit=${limit}`;
    }

    if (controls?.type && controls.type.length > 0) {
      url = appendGetParam(url, 'type', controls.type);
    }

    const textQuery = controls?.query ?? legacyTextQuery;
    if (textQuery) {
      url = appendGetParam(url, 'query', textQuery);
    }
    if (controls?.location) {
      url = appendGetParam(url, 'location', controls.location);
    }
    if (controls?.startPrice) {
      url = appendGetParam(url, 'startPrice', controls.startPrice);
    }
    if (controls?.endPrice) {
      url = appendGetParam(url, 'endPrice', controls.endPrice);
    }
    if (controls?.isNegotiable === true || controls?.isNegotiable === false) {
      url = appendGetParam(url, 'isNegotiable', controls.isNegotiable);
    }
    if (controls?.bedrooms) {
      url = appendGetParam(url, 'bedrooms', controls.bedrooms);
    }
    if (controls?.bathrooms) {
      url = appendGetParam(url, 'bathrooms', controls.bathrooms);
    }
    if (controls?.toilets) {
      url = appendGetParam(url, 'toilets', controls.toilets);
    }

    debugLog('request:start', {
      method: 'GET',
      url,
      host: BASE_URL,
    });

    const makeGet = () =>
      fetch(url, {
        headers: fbAcceptHeaders(),
      });
    let res = await makeGet();
    if (!res.ok && res.status >= 500) {
      res = await makeGet();
    }
    const ab = await res.arrayBuffer();
    const parsed = parseFlatResponse(ab, res.status) as ResponseI<X>;
    if (!res.ok) {
      parsed.msg = normalizeError(res.status, parsed.msg || 'Request failed');
    }
    debugLog('request:end', {
      method: 'GET',
      url,
      status: res.status,
      ok: res.ok,
      durationMs: Date.now() - startedAt,
      response: parsed,
    });
    return parsed;
  } catch (error) {
    const message = normalizeErrorMessage(error);
    debugError('request:error', {
      method: 'GET',
      url,
      durationMs: Date.now() - startedAt,
      error: message,
    });
    return { msg: `Network error: ${message}. Check your connection.`, content: [] as X[], status: 0 };
  }
};

const jsonAuthHeaders = () => ({
  ...authHeader(),
  Accept: 'application/json',
});

const jsonPostHeaders = () => ({
  ...authHeader(),
  Accept: 'application/json',
  'Content-Type': 'application/json',
});

/** Small JSON helpers for routes that are not FlatBuffers (e.g. ID verification). */
export async function getJson<T = Record<string, unknown>>(
  path: string
): Promise<{ ok: boolean; status: number; data?: T; msg?: string }> {
  const url = `${BASE_URL}/${path.replace(/^\//, '')}`;
  const startedAt = Date.now();
  try {
    const res = await fetch(url, { headers: jsonAuthHeaders() });
    let data: T | undefined;
    try {
      data = (await res.json()) as T;
    } catch {
      data = undefined;
    }
    const msg =
      data && typeof data === 'object' && data !== null && 'msg' in data
        ? String((data as { msg?: unknown }).msg ?? '')
        : '';
    debugLog('request:end', {
      method: 'GET',
      url,
      status: res.status,
      ok: res.ok,
      durationMs: Date.now() - startedAt,
      json: data,
    });
    return { ok: res.ok, status: res.status, data, msg: msg || undefined };
  } catch (error) {
    const message = normalizeErrorMessage(error);
    debugError('request:error', { method: 'GET', url, error: message });
    return { ok: false, status: 0, msg: message };
  }
}

export async function postJson<TBody extends Record<string, unknown>, TRes = Record<string, unknown>>(
  path: string,
  body: TBody
): Promise<{ ok: boolean; status: number; data?: TRes; msg?: string }> {
  const url = `${BASE_URL}/${path.replace(/^\//, '')}`;
  const startedAt = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: jsonPostHeaders(),
      body: JSON.stringify(body),
    });
    let data: TRes | undefined;
    try {
      data = (await res.json()) as TRes;
    } catch {
      data = undefined;
    }
    const msg =
      data && typeof data === 'object' && data !== null && 'msg' in data
        ? String((data as { msg?: unknown }).msg ?? '')
        : '';
    debugLog('request:end', {
      method: 'POST',
      url,
      status: res.status,
      ok: res.ok,
      durationMs: Date.now() - startedAt,
      json: data,
    });
    return { ok: res.ok, status: res.status, data, msg: msg || undefined };
  } catch (error) {
    const message = normalizeErrorMessage(error);
    debugError('request:error', { method: 'POST', url, error: message });
    return { ok: false, status: 0, msg: message };
  }
}

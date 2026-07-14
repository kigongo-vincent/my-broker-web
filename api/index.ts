import { AuthStoreI as UserStoreI, useUserStore } from "../src/store/auth";
import {
  shouldBlockAutoSuccessToast,
  showErrorToast,
  showSuccessToast,
} from "../lib/index";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const REQUEST_TIMEOUT_MS = 45_000;

async function fetchWithTimeout(
  input: string,
  init: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

const PERSIST_KEY = "_jdncjnsckchsbchkbcknsncknksjncchbfk";

/** Zustand persist JSON; missing/invalid storage must not throw (JSON.parse("") is invalid). */
function authHeaders(): Record<string, string> {
  try {
    const raw = localStorage?.getItem(PERSIST_KEY);
    if (!raw?.trim()) return {};
    const parsed = JSON.parse(raw) as { state?: UserStoreI };
    const token = parsed?.state?.token;
    if (typeof token !== "string" || !token) return {};
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

let authRedirectScheduled = false;

/** JWT/session invalid on a protected call: clear auth and send user to login (skip auth routes). */
function handleUnauthorizedSession(apiPath: string) {
  const p = apiPath.replace(/^\//, "");
  if (/^(user\/(login|signup|google-auth|google-lookup))/.test(p)) {
    return;
  }
  if (authRedirectScheduled) return;
  authRedirectScheduled = true;
  try {
    useUserStore.getState().logout();
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    const next = encodeURIComponent(
      window.location.pathname + window.location.search
    );
    window.location.replace(`/auth?next=${next}`);
  }
}

export interface APIResponse<T> {
  msg: string;
  data: T;
  status: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const safeJson = async (res: Response): Promise<any> => {
  try {
    return await res.json();
  } catch {
    return {};
  }
};

function apiMessage(responseData: unknown): string {
  if (!responseData || typeof responseData !== "object") return "";
  const o = responseData as { msg?: unknown; message?: unknown };
  const m = o.msg ?? o.message;
  return typeof m === "string" ? m : "";
}

const handleHTTPError = (res: Response, responseData: any, apiPath: string) => {
  const msgLower = apiMessage(responseData).toLowerCase();

  if (res.status === 401) {
    handleUnauthorizedSession(apiPath);
    return;
  }

  const forceLogout =
    (res.status === 403 && msgLower.includes("account is deactivated")) ||
    (res.status === 400 && msgLower.includes("missing token")) ||
    (res.status === 403 && msgLower.includes("authentication failed"));

  if (forceLogout) {
    handleUnauthorizedSession(apiPath);
    return;
  }

  if (res.status >= 400) {
    showErrorToast(
      "Request failed",
      apiMessage(responseData) ||
        "Unable to complete this request. Please try again."
    );
  }
};

const maybeSuccessToast = (
  apiPath: string,
  res: Response,
  responseData: any
) => {
  if (!res.ok) return;
  const msg =
    typeof responseData?.msg === "string" ? responseData.msg.trim() : "";
  if (!msg) return;
  if (shouldBlockAutoSuccessToast(apiPath)) return;
  showSuccessToast(msg);
};

const getPaginationFromHeaders = (res: Response) => {
  const page = Number(res.headers.get("X-Pagination-Page") || 0);
  const limit = Number(res.headers.get("X-Pagination-Limit") || 0);
  const total = Number(res.headers.get("X-Pagination-Total") || 0);
  const totalPages = Number(res.headers.get("X-Pagination-Total-Pages") || 0);
  if (!page || !limit) return undefined;
  return { page, limit, total, totalPages };
};

export const Post = async <T, U>(
  path: string,
  data: T,
  url?: string
): Promise<APIResponse<U>> => {
  try {
    const res = await fetchWithTimeout(`${url ? url : API_BASE_URL}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(data),
    });
    const responseData = await safeJson(res);
    handleHTTPError(res, responseData, path);
    maybeSuccessToast(path, res, responseData);
    return {
      ...responseData,
      status: res.status,
      pagination: getPaginationFromHeaders(res),
    } as APIResponse<U>;
  } catch (error) {
    const aborted =
      error instanceof DOMException && error.name === "AbortError";
    showErrorToast(
      aborted ? "Request timed out" : "Network error",
      aborted
        ? "The server took too long to respond. Try again."
        : "Could not reach the server. Check your connection and try again."
    );
    throw error;
  }
};

export const Get = async <T>(path: string): Promise<APIResponse<T>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/${path}`, {
      headers: {
        ...authHeaders(),
      },
    });

    const responseData = await safeJson(res);
    handleHTTPError(res, responseData, path);
    return {
      ...responseData,
      status: res.status,
      pagination: getPaginationFromHeaders(res),
    } as APIResponse<T>;
  } catch (error) {
    const aborted =
      error instanceof DOMException && error.name === "AbortError";
    showErrorToast(
      aborted ? "Request timed out" : "Network error",
      aborted
        ? "The server took too long to respond. Try again."
        : "Could not reach the server. Check your connection and try again."
    );
    throw error;
  }
};

export const Put = async <T, U>(
  path: string,
  data: T
): Promise<APIResponse<U>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(data),
    });
    const responseData = await safeJson(res);
    handleHTTPError(res, responseData, path);
    maybeSuccessToast(path, res, responseData);
    return {
      ...responseData,
      status: res.status,
      pagination: getPaginationFromHeaders(res),
    } as APIResponse<U>;
  } catch (error) {
    const aborted =
      error instanceof DOMException && error.name === "AbortError";
    showErrorToast(
      aborted ? "Request timed out" : "Network error",
      aborted
        ? "The server took too long to respond. Try again."
        : "Could not reach the server. Check your connection and try again."
    );
    throw error;
  }
};

export const DeleteReq = async <U>(path: string): Promise<APIResponse<U>> => {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/${path}`, {
      method: "DELETE",
      headers: {
        ...authHeaders(),
      },
    });
    const responseData = await safeJson(res);
    handleHTTPError(res, responseData, path);
    maybeSuccessToast(path, res, responseData);
    return {
      ...responseData,
      status: res.status,
      pagination: getPaginationFromHeaders(res),
    } as APIResponse<U>;
  } catch (error) {
    const aborted =
      error instanceof DOMException && error.name === "AbortError";
    showErrorToast(
      aborted ? "Request timed out" : "Network error",
      aborted
        ? "The server took too long to respond. Try again."
        : "Could not reach the server. Check your connection and try again."
    );
    throw error;
  }
};

/** Build `storage/get-presigned-url` query. Include `contentLength` (= file.size) so the presigned URL can sign Content-Length together with Host. */
export function presignedUploadParams(
  file: Pick<File, "name" | "size">
): string {
  const q = new URLSearchParams();
  q.set("filename", file.name);
  if (typeof file.size === "number" && file.size > 0) {
    q.set("contentLength", String(file.size));
  }
  return q.toString();
}

function s3PutErrorMessage(status: number, bodyText: string): string {
  const code = bodyText.match(/<Code>([^<]+)<\/Code>/)?.[1];
  const message = bodyText.match(/<Message>([^<]+)<\/Message>/)?.[1];
  if (code) {
    return message ? `${code}: ${message}` : code;
  }
  const trimmed = bodyText.trim();
  if (trimmed) return trimmed.slice(0, 300);
  return `S3 upload failed (HTTP ${status})`;
}

export const s3Upload = async (url: string, file: File): Promise<string> => {
  // Do not pass `File`/`Blob` with a non-empty `.type` as body: runtimes often set
  // `Content-Type` from it, which is not part of this presigned URL's signature.
  const body = new Uint8Array(await file.arrayBuffer());
  if (
    typeof file.size === "number" &&
    file.size > 0 &&
    body.length !== file.size
  ) {
    return "S3 upload failed: file size mismatch after read";
  }
  const res = await fetch(url, {
    method: "PUT",
    body,
  });

  if (res.status != 200) {
    const text = await res.text().catch(() => "");
    console.error("S3 PUT failed", res.status, text);
    return s3PutErrorMessage(res.status, text);
  }
  return "";
};

/**
 * Upload a file to S3 via a presigned PUT URL, streaming real-time progress
 * via the `onProgress` callback (value 0–100).
 */
export const s3UploadWithProgress = (
  url: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<string> => {
  return new Promise<string>((resolve) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(Math.min(pct, 99)); // hold at 99 until fully confirmed
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        onProgress(100);
        resolve("");
      } else {
        const msg = s3PutErrorMessage(xhr.status, xhr.responseText ?? "");
        resolve(msg);
      }
    });

    xhr.addEventListener("error", () =>
      resolve("S3 upload failed: network error")
    );
    xhr.addEventListener("abort", () => resolve("S3 upload was cancelled"));

    xhr.open("PUT", url);
    // No Content-Type header — presigned URL signature does not include it
    xhr.send(file);
  });
};

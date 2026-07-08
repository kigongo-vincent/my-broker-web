export type ToastDetail = {
  type: "success" | "info" | "error";
  message: string;
  /** Shown above the message (e.g. “Request failed”) */
  title?: string;
};

const TOAST_EVENT = "app:toast";

export function showSuccessToast(message: string) {
  if (typeof window === "undefined" || !message?.trim()) return;
  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_EVENT, {
      detail: { type: "success", message: message.trim() },
    })
  );
}

/** HTTP / network failures from the API client (non-blocking). */
export function showErrorToast(title: string, message: string) {
  if (typeof window === "undefined") return;
  const t = (title || "").trim();
  const m = (message || "").trim();
  if (!t && !m) return;
  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_EVENT, {
      detail: {
        type: "error",
        title: t || undefined,
        message: m || t,
      },
    })
  );
}

export function showInfoToast(message: string, title?: string) {
  if (typeof window === "undefined" || !message?.trim()) return;
  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_EVENT, {
      detail: {
        type: "info",
        message: message.trim(),
        title: title?.trim() || undefined,
      },
    })
  );
}

/** Paths where mutating requests should not auto-toast (auth redirects handle UX). */
export function shouldBlockAutoSuccessToast(apiPath: string): boolean {
  const p = apiPath.replace(/^\//, "");
  return (
    /^(user\/(login|google-auth|signup|google-lookup))/.test(p) ||
    /^inbox\//.test(p)
  );
}

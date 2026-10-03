import { useEffect } from "react";

export function useGlobalKeyboardDismiss() {
  useEffect(() => {
    // Check if the element or any parent container has the opt-out attribute
    const shouldKeepKeyboard = (element: any) => {
      if (!element || !(element instanceof HTMLElement)) return false;
      return Boolean(element.closest("[data-keep-keyboard]"));
    };

    const handleGlobalSubmit = (event: any) => {
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        !shouldKeepKeyboard(active) &&
        !shouldKeepKeyboard(event.target)
      ) {
        active.blur();
      }
    };

    const handleKeyDown = (event: any) => {
      if (
        event.key === "Enter" &&
        (event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement)
      ) {
        if (!shouldKeepKeyboard(event.target)) {
          event.target.blur();
        }
      }
    };

    document.addEventListener("submit", handleGlobalSubmit, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("submit", handleGlobalSubmit, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);
}

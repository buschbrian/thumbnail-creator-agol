import { useEffect, useRef } from "react";

type Handler = (event: Event) => void;

export function useDomEvents<T = never>(
  bindings: ReadonlyArray<readonly [string, Handler]>,
): React.RefObject<T> {
  const ref = useRef<any>(null);

  useEffect(() => {
    const element: unknown = ref.current;
    if (!element || typeof element !== "object") return;
    const target = element as {
      addEventListener: (type: string, fn: Handler) => void;
      removeEventListener: (type: string, fn: Handler) => void;
    };
    const listeners = bindings.map(([eventName, handler]) => {
      const listener: Handler = (event) => handler(event);
      target.addEventListener(eventName, listener);
      return [eventName, listener] as const;
    });
    return () => {
      for (const [eventName, listener] of listeners) {
        target.removeEventListener(eventName, listener);
      }
    };
  });

  return ref;
}

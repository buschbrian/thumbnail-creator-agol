import { useEffect, useState, type RefObject } from "react";

const PADDING = 48;
const MIN_SCALE = 0.05;
const MAX_SCALE = 2;

export function useFitScale(
  containerRef: RefObject<HTMLDivElement | null>,
  docWidth: number,
  docHeight: number,
): number {
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const compute = (): void => {
      const availableWidth = element.clientWidth - PADDING * 2;
      const availableHeight = element.clientHeight - PADDING * 2;
      if (availableWidth <= 0 || availableHeight <= 0) return;
      const next = Math.min(
        availableWidth / docWidth,
        availableHeight / docHeight,
      );
      setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, next)));
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef, docWidth, docHeight]);

  return scale;
}

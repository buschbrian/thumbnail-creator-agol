import { useEffect, useState } from "react";

export type ImageLoadStatus = "loading" | "loaded" | "failed";

interface ImageState {
  url: string | undefined;
  image: HTMLImageElement | undefined;
  status: ImageLoadStatus;
}

export function useImage(
  url: string,
): [HTMLImageElement | undefined, ImageLoadStatus] {
  const [state, setState] = useState<ImageState>({
    url: undefined,
    image: undefined,
    status: "loading",
  });

  useEffect(() => {
    let alive = true;
    const element = new Image();
    element.onload = (): void => {
      if (!alive) return;
      setState({ url, image: element, status: "loaded" });
    };
    element.onerror = (): void => {
      if (!alive) return;
      setState({ url, image: undefined, status: "failed" });
    };
    element.src = url;
    return () => {
      alive = false;
    };
  }, [url]);

  if (state.url !== url) {
    return [undefined, "loading"];
  }
  return [state.image, state.status];
}

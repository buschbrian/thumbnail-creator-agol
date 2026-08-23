import Konva from "konva";

export interface ExportOptions {
  format: "png" | "jpeg";
  quality: number;
}

export async function renderThumbnailBlob(
  stage: Konva.Stage,
  width: number,
  height: number,
  options: ExportOptions,
): Promise<Blob> {
  const contentLayer = stage
    .getLayers()
    .find((layer) => layer.name() === "content");
  if (!contentLayer) {
    throw new Error("Canvas is not ready yet.");
  }

  const holder = document.createElement("div");
  holder.style.position = "fixed";
  holder.style.left = "-100000px";
  holder.style.top = "0";
  document.body.appendChild(holder);

  let offStage: Konva.Stage | null = null;
  try {
    offStage = new Konva.Stage({
      container: holder,
      width,
      height,
    });
    const clone = contentLayer.clone();
    clone.listening(false);
    offStage.add(clone);
    offStage.draw();

    const blob = await new Promise<Blob | null>((resolve) => {
      offStage?.toBlob({
        mimeType: options.format === "jpeg" ? "image/jpeg" : "image/png",
        quality: Math.min(1, Math.max(0, options.quality / 100)),
        pixelRatio: 1,
        width,
        height,
        callback: resolve,
      });
    });

    if (!blob) throw new Error("The browser could not encode the image.");
    return blob;
  } finally {
    offStage?.destroy();
    holder.remove();
  }
}

import { stageRef } from "../canvas/stageRef";
import { useEditorStore } from "../state/store";
import { downloadBlob } from "./download";
import { buildFilename } from "./filename";
import { renderThumbnailBlob } from "./exportImage";
import { resolveAltText } from "./altText";
import { embedPngMetadata, embedJpegMetadata } from "./metadata";
import { useUIStore } from "../ui/uiStore";

export async function performExport(): Promise<void> {
  const ui = useUIStore.getState();
  if (ui.exportBusy) return;

  const stage = stageRef.current;
  if (!stage) {
    ui.pushAlert("danger", "Canvas not ready", "Give the editor a moment and try again.");
    return;
  }

  const { doc, layers, select } = useEditorStore.getState();
  const { format, quality } = ui.exportSettings;
  const filename = buildFilename(doc.title, doc.width, doc.height, format);
  const altText = resolveAltText(doc, layers);

  ui.setExportBusy(true);
  try {
    select(null);
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    const raw = await renderThumbnailBlob(stage, doc.width, doc.height, {
      format,
      quality,
    });
    const metadata = { title: doc.title || "Thumbnail", description: altText };
    const tagged =
      format === "png"
        ? await embedPngMetadata(raw, metadata)
        : await embedJpegMetadata(raw, metadata);
    downloadBlob(tagged, filename);
    ui.pushAlert(
      "success",
      "Exported with alt text",
      `${filename} · accessibility metadata embedded`,
    );
  } catch (error) {
    ui.pushAlert("danger", "Export failed", (error as Error).message);
  } finally {
    ui.setExportBusy(false);
  }
}

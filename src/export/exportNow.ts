import { stageRef } from "../canvas/stageRef";
import { useEditorStore } from "../state/store";
import { downloadBlob } from "./download";
import { buildFilename } from "./filename";
import { renderThumbnailBlob } from "./exportImage";
import { useUIStore } from "../ui/uiStore";

export async function performExport(): Promise<void> {
  const ui = useUIStore.getState();
  if (ui.exportBusy) return;

  const stage = stageRef.current;
  if (!stage) {
    ui.pushAlert("danger", "Canvas not ready", "Give the editor a moment and try again.");
    return;
  }

  const { doc, select } = useEditorStore.getState();
  const { format, quality } = ui.exportSettings;
  const filename = buildFilename(doc.title, doc.width, doc.height, format);

  ui.setExportBusy(true);
  try {
    select(null);
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    const blob = await renderThumbnailBlob(stage, doc.width, doc.height, {
      format,
      quality,
    });
    downloadBlob(blob, filename);
    ui.pushAlert("success", "Thumbnail exported", filename);
  } catch (error) {
    ui.pushAlert("danger", "Export failed", (error as Error).message);
  } finally {
    ui.setExportBusy(false);
  }
}

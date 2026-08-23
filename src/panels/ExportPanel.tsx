import { useCallback, useMemo, useState } from "react";
import { useEditorStore } from "../state/store";
import { stageRef } from "../canvas/stageRef";
import { buildFilename } from "../export/filename";
import { validateDimensions } from "../export/validation";
import { downloadBlob } from "../export/download";
import { renderThumbnailBlob } from "../export/exportImage";
import { useUIStore } from "../ui/uiStore";
import { useDomEvents } from "../hooks/useDomEvents";

export function ExportPanel() {
  const doc = useEditorStore((s) => s.doc);
  const select = useEditorStore((s) => s.select);
  const pushAlert = useUIStore((s) => s.pushAlert);

  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [quality, setQuality] = useState(90);
  const [busy, setBusy] = useState(false);

  const extension = format === "png" ? "png" : "jpeg";
  const filename = buildFilename(doc.title, doc.width, doc.height, extension);

  const warnings = useMemo(
    () => validateDimensions(doc.width, doc.height),
    [doc.width, doc.height],
  );

  const formatRef = useDomEvents([
    [
      "calciteSegmentedControlChange",
      (event) => {
        const value = (event.target as HTMLInputElement).value;
        if (value === "png" || value === "jpeg") setFormat(value);
      },
    ],
  ]);

  const qualityRef = useDomEvents([
    ["calciteSliderInput", (event) =>
      setQuality(Number((event.target as HTMLInputElement).value)),
    ],
  ]);

  const onExport = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage || busy) return;

    setBusy(true);
    try {
      select(null);
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      const blob = await renderThumbnailBlob(
        stage,
        doc.width,
        doc.height,
        { format, quality },
      );
      downloadBlob(blob, filename);
      pushAlert("success", "Thumbnail exported", filename);
    } catch (error) {
      pushAlert("danger", "Export failed", (error as Error).message);
    } finally {
      setBusy(false);
    }
  }, [busy, doc.width, doc.height, filename, format, quality, pushAlert, select]);

  return (
    <div className="export-body">
      <div className="field">
        <span className="field-label">Format</span>
        <calcite-segmented-control
          ref={formatRef}
          scale="s"
          value={format}
          aria-label="Export format"
        >
          <calcite-segmented-control-item value="png">
            PNG
          </calcite-segmented-control-item>
          <calcite-segmented-control-item value="jpeg">
            JPEG
          </calcite-segmented-control-item>
        </calcite-segmented-control>
      </div>

      {format === "jpeg" ? (
        <div className="field">
          <span className="field-label">JPEG quality ({quality})</span>
          <calcite-slider
            ref={qualityRef}
            scale="s"
            min={10}
            max={100}
            step={5}
            value={quality}
            aria-label="JPEG quality"
          />
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="export-warnings" role="alert">
          {warnings.map((warning) => (
            <calcite-notice key={warning.code} kind="warning" scale="s" icon open>
              <div slot="message">{warning.message}</div>
            </calcite-notice>
          ))}
        </div>
      ) : null}

      <p className="filename-preview">{filename}</p>

      <calcite-button
        width="full"
        icon-start="download"
        loading={busy}
        aria-label={`Download ${filename}`}
        onClick={() => void onExport()}
      >
        Download {format.toUpperCase()}
      </calcite-button>
    </div>
  );
}

import { useMemo } from "react";
import { useUIStore } from "../ui/uiStore";
import { validateDimensions } from "./../export/validation";
import { buildFilename } from "../export/filename";
import { performExport } from "../export/exportNow";
import { useEditorStore } from "../state/store";
import { useDomEvents } from "../hooks/useDomEvents";

export function ExportPanel() {
  const doc = useEditorStore((s) => s.doc);
  const exportSettings = useUIStore((s) => s.exportSettings);
  const setExportSettings = useUIStore((s) => s.setExportSettings);
  const exportBusy = useUIStore((s) => s.exportBusy);

  const { format, quality } = exportSettings;
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
        if (value === "png" || value === "jpeg") setExportSettings({ format: value });
      },
    ],
  ]);

  const qualityRef = useDomEvents([
    [
      "calciteSliderInput",
      (event) =>
        setExportSettings({
          quality: Number((event.target as HTMLInputElement).value),
        }),
    ],
  ]);

  return (
    <div className="properties-body">
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
          <span className="field-label">Quality · {quality}</span>
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

      <div className="export-meta">
        <span className="field-label">File name</span>
        <code className="filename-preview">{filename}</code>
      </div>

      {warnings.length > 0 ? (
        <ul className="export-warnings">
          {warnings.map((warning) => (
            <li key={warning.code} className="warning-item">
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path
                  d="M8 1.5 15 14H1z"
                  fill="#ffb600"
                  stroke="#b8860b"
                  strokeWidth="0.6"
                />
                <path d="M8 6v4.2M8 12.1v.9" stroke="#4a3b00" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              {warning.message}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="field-hint">
        Exports at exactly {doc.width} × {doc.height} pixels — editor zoom,
        guides, and selection handles are never included.
      </p>

      <calcite-button
        width="full"
        icon-start="download"
        loading={exportBusy}
        aria-label={`Download ${filename}`}
        onClick={() => void performExport()}
      >
        Download {format.toUpperCase()}
      </calcite-button>
    </div>
  );
}

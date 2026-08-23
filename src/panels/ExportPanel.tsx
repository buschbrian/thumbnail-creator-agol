import { useMemo, useState } from "react";
import { useEditorStore } from "../state/store";
import { useUIStore } from "../ui/uiStore";
import { validateDimensions } from "./../export/validation";
import { buildFilename } from "../export/filename";
import { performExport } from "../export/exportNow";
import { altTextHealth, resolveAltText } from "../export/altText";
import { useDomEvents } from "../hooks/useDomEvents";

export function ExportPanel() {
  const doc = useEditorStore((s) => s.doc);
  const layers = useEditorStore((s) => s.layers);
  const setAltTextOverride = useEditorStore((s) => s.setAltTextOverride);
  const exportSettings = useUIStore((s) => s.exportSettings);
  const setExportSettings = useUIStore((s) => s.setExportSettings);
  const exportBusy = useUIStore((s) => s.exportBusy);
  const pushAlert = useUIStore((s) => s.pushAlert);

  const [editingAlt, setEditingAlt] = useState(false);

  const { format, quality } = exportSettings;
  const extension = format === "png" ? "png" : "jpeg";
  const filename = buildFilename(doc.title, doc.width, doc.height, extension);

  const warnings = useMemo(
    () => validateDimensions(doc.width, doc.height),
    [doc.width, doc.height],
  );

  const effectiveAlt = resolveAltText(doc, layers);
  const health = altTextHealth(effectiveAlt);
  const isCustom = (doc.altTextOverride?.trim().length ?? 0) > 0;

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

  const altAreaRef = useDomEvents([
    [
      "calciteTextAreaChange",
      (event) =>
        setAltTextOverride((event.target as HTMLTextAreaElement).value),
    ],
  ]);

  const copyAlt = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(effectiveAlt);
      pushAlert("success", "Alt text copied", "Paste it into the item's Alt Text field.");
    } catch {
      pushAlert("danger", "Copy failed", "Select the text and copy manually.");
    }
  };

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

      <div className="alt-block">
        <div className="alt-head">
          <span className="field-label">Alt text</span>
          <span className={`alt-pill alt-${health.level}`}>
            {health.level === "good"
              ? "Auto"
              : health.level === "long"
                ? "Long"
                : "Empty"}
          </span>
        </div>

        {editingAlt ? (
          <>
            <calcite-text-area
              ref={altAreaRef}
              scale="s"
              rows={4}
              value={isCustom ? doc.altTextOverride : effectiveAlt}
              aria-label="Alt text override"
            />
            <div className="alt-actions">
              <calcite-button
                scale="s"
                appearance="transparent"
                onClick={() => {
                  setAltTextOverride("");
                  setEditingAlt(false);
                }}
              >
                Use auto
              </calcite-button>
              <calcite-button
                scale="s"
                appearance="outline-fill"
                onClick={() => setEditingAlt(false)}
              >
                Done
              </calcite-button>
            </div>
          </>
        ) : (
          <>
            <p className="alt-preview">{effectiveAlt}</p>
            <div className="alt-actions">
              <calcite-button
                scale="s"
                appearance="transparent"
                icon-start="copy"
                onClick={() => void copyAlt()}
              >
                Copy
              </calcite-button>
              <calcite-button
                scale="s"
                appearance="transparent"
                icon-start="pencil"
                onClick={() => setEditingAlt(true)}
              >
                {isCustom ? "Edit" : "Override"}
              </calcite-button>
            </div>
          </>
        )}

        <p className={`field-hint alt-hint-${health.level}`}>{health.hint}</p>
        <p className="field-hint">
          Embedded into the exported file automatically
          {format === "png" ? " (PNG Description)" : " (JPEG comment)"}. Also
          paste it into the item's <strong>Alt Text</strong> field in ArcGIS
          Online.
        </p>
      </div>

      <div className="export-meta">
        <span className="field-label">File name</span>
        <code className="filename-preview">{filename}</code>
      </div>

      {warnings.length > 0 ? (
        <ul className="export-warnings">
          {warnings.map((warning) => (
            <li key={warning.code} className="warning-item">
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path d="M8 1.5 15 14H1z" fill="#111111" opacity="0.85" />
                <path d="M8 6v4.2M8 12.1v.9" stroke="#ffef99" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              {warning.message}
            </li>
          ))}
        </ul>
      ) : null}

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

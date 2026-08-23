import { useCallback } from "react";
import { useEditorStore, pauseHistory, resumeHistory } from "../state/store";
import { useUIStore } from "../ui/uiStore";
import { performExport } from "../export/exportNow";
import { useDomEvents } from "../hooks/useDomEvents";
import { useHistoryFlags } from "../hooks/useHistoryFlags";

function BrandMark(): React.ReactElement {
  return (
    <svg width="26" height="26" viewBox="0 0 16 16" aria-hidden="true">
      <rect width="16" height="16" rx="4" fill="#272625" />
      <path d="M3.6 11.2V6.9L7 4.2l3.1 2.7h2.5v4.3z" fill="#ffffff" />
      <circle cx="11.6" cy="4.9" r="1.25" fill="#e8400d" />
    </svg>
  );
}

export function TopBar() {
  const doc = useEditorStore((s) => s.doc);
  const flags = useHistoryFlags();
  const exportBusy = useUIStore((s) => s.exportBusy);
  const exportFormat = useUIStore((s) => s.exportSettings.format);

  const onInput = useCallback((event: Event) => {
    pauseHistory();
    const value = (event.target as HTMLInputElement).value;
    useEditorStore.getState().setTitle(value);
  }, []);

  const onChange = useCallback((event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    useEditorStore.getState().setTitle(value);
    resumeHistory();
  }, []);

  const titleRef = useDomEvents([
    ["calciteInputTextInput", onInput],
    ["calciteInputTextChange", onChange],
  ]);

  return (
    <div className="topbar">
      <div className="brand">
        <BrandMark />
        <span className="brand-name">Thumbnail Maker</span>
        <span className="brand-scope">for ArcGIS Online</span>
      </div>

      <calcite-input-text
        ref={titleRef}
        className="title-input"
        placeholder="Untitled thumbnail"
        aria-label="Thumbnail title used for the export filename"
        value={doc.title}
        scale="s"
        max-length={80}
      />

      <div className="topbar-actions">
        <div className="history-cluster" role="group" aria-label="History">
          <button
            type="button"
            className="icon-btn"
            aria-label="Undo (Ctrl+Z)"
            title="Undo (Ctrl+Z)"
            disabled={!flags.canUndo}
            onClick={() => useEditorStore.temporal.getState().undo()}
          >
            <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
              <path
                d="M6 3.5 2.5 7 6 10.5M2.5 7H10a3.5 3.5 0 0 1 0 7H7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Redo (Ctrl+Y)"
            title="Redo (Ctrl+Y)"
            disabled={!flags.canRedo}
            onClick={() => useEditorStore.temporal.getState().redo()}
          >
            <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
              <path
                d="M10 3.5 13.5 7 10 10.5M13.5 7H6a3.5 3.5 0 0 0 0 7h3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <span className="size-chip" title="Canvas dimensions">
          {doc.width} × {doc.height}
        </span>

        <calcite-button
          kind="brand"
          scale="s"
          icon-start="download"
          loading={exportBusy}
          aria-label={`Export ${exportFormat.toUpperCase()} thumbnail`}
          onClick={() => void performExport()}
        >
          Export
        </calcite-button>
      </div>
    </div>
  );
}

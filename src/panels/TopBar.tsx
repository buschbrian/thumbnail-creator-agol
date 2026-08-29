import { useCallback, useEffect, useRef, useState } from "react";
import { SIZE_PRESETS, matchingSizePreset } from "../presets/presets";
import { useEditorStore, pauseHistory, resumeHistory } from "../state/store";
import { useUIStore } from "../ui/uiStore";
import { useDomEvents } from "../hooks/useDomEvents";
import { useHistoryFlags } from "../hooks/useHistoryFlags";
import { performExport } from "../export/exportNow";
import {
  downloadPreparedProject,
  prepareProjectExport,
  type PreparedProjectExport,
} from "../project/exportProject";

function BrandMark(): React.ReactElement {
  return (
    <svg width="26" height="26" viewBox="0 0 16 16" aria-hidden="true">
      <rect width="16" height="16" rx="4" fill="#272625" />
      <path d="M3.6 11.2V6.9L7 4.2l3.1 2.7h2.5v4.3z" fill="#ffffff" />
      <circle cx="11.6" cy="4.9" r="1.25" fill="#e8400d" />
    </svg>
  );
}

function SizeMenu({ onClose }: { onClose: () => void }) {
  const doc = useEditorStore((s) => s.doc);
  const setSize = useEditorStore((s) => s.setSize);
  const pushAlert = useUIStore((s) => s.pushAlert);
  const [customWidth, setCustomWidth] = useState(String(doc.width));
  const [customHeight, setCustomHeight] = useState(String(doc.height));

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent): void => {
      if (!cardRef.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const activePresetId = matchingSizePreset(doc.width, doc.height)?.id ?? "custom";

  const widthRef = useDomEvents([
    ["calciteInputNumberInput", (e) => setCustomWidth((e.target as HTMLInputElement).value)],
  ]);
  const heightRef = useDomEvents([
    ["calciteInputNumberInput", (e) => setCustomHeight((e.target as HTMLInputElement).value)],
  ]);

  const applyCustom = (): void => {
    const width = Math.round(Number(customWidth));
    const height = Math.round(Number(customHeight));
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width < 50 ||
      height < 50
    ) {
      pushAlert("warning", "Invalid size", "Use dimensions of at least 50 pixels.");
      return;
    }
    if (width > 8000 || height > 8000) {
      pushAlert("warning", "Very large canvas", "Keep dimensions at or below 8000 pixels.");
      return;
    }
    setSize(width, height);
    onClose();
  };

  return (
    <div className="size-menu" ref={cardRef} role="dialog" aria-label="Canvas size">
      {SIZE_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className={`size-option${activePresetId === preset.id ? " is-active" : ""}`}
          onClick={() => {
            setSize(preset.width, preset.height);
            onClose();
          }}
        >
          <span className="size-option-name">{preset.label}</span>
          <span className="size-option-dims">
            {preset.width} × {preset.height}
          </span>
        </button>
      ))}
      <div className="size-menu-custom">
        <calcite-input-number
          ref={widthRef}
          scale="s"
          value={customWidth}
          aria-label="Custom width in pixels"
        />
        <span aria-hidden="true">×</span>
        <calcite-input-number
          ref={heightRef}
          scale="s"
          value={customHeight}
          aria-label="Custom height in pixels"
        />
        <calcite-button scale="s" appearance="outline-fill" onClick={applyCustom}>
          Apply
        </calcite-button>
      </div>
    </div>
  );
}

export function TopBar() {
  const doc = useEditorStore((s) => s.doc);
  const flags = useHistoryFlags();
  const exportBusy = useUIStore((s) => s.exportBusy);
  const exportFormat = useUIStore((s) => s.exportSettings.format);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [projectBusy, setProjectBusy] = useState(false);
  const [pendingProject, setPendingProject] =
    useState<PreparedProjectExport | null>(null);

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
  const warningDialogRef = useDomEvents([
    ["calciteDialogClose", () => setPendingProject(null)],
  ]);

  const saveProject = useCallback(async (): Promise<void> => {
    if (projectBusy) return;
    setProjectBusy(true);
    const ui = useUIStore.getState();
    const editor = useEditorStore.getState();
    try {
      const prepared = await prepareProjectExport({
        doc: editor.doc,
        backgroundColor: editor.backgroundColor,
        layers: editor.layers,
      });
      if (prepared.warnings.length > 0) {
        setPendingProject(prepared);
        return;
      }
      downloadPreparedProject(prepared);
      ui.pushAlert("success", "Editable project saved", prepared.filename);
    } catch (error) {
      ui.pushAlert("danger", "Project save failed", (error as Error).message);
    } finally {
      setProjectBusy(false);
    }
  }, [projectBusy]);

  const confirmLargeProject = (): void => {
    if (!pendingProject) return;
    try {
      downloadPreparedProject(pendingProject, { acceptWarnings: true });
      useUIStore
        .getState()
        .pushAlert("success", "Editable project saved", pendingProject.filename);
    } catch (error) {
      useUIStore
        .getState()
        .pushAlert("danger", "Project save failed", (error as Error).message);
    } finally {
      setPendingProject(null);
    }
  };

  return (
    <>
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

          <div className="size-anchor">
            <button
              type="button"
              className="size-chip"
              aria-haspopup="dialog"
              aria-expanded={sizeOpen}
              aria-label={`Canvas size ${doc.width} by ${doc.height} pixels — change`}
              title="Change canvas size"
              onClick={() => setSizeOpen((open) => !open)}
            >
              {doc.width} × {doc.height}
            </button>
            {sizeOpen ? <SizeMenu onClose={() => setSizeOpen(false)} /> : null}
          </div>

          <calcite-button
            scale="s"
            appearance="transparent"
            icon-start="save"
            loading={projectBusy}
            aria-label="Download editable project"
            title="Download editable project"
            onClick={() => void saveProject()}
          >
            <span className="sr-only">Download editable project</span>
          </calcite-button>

          <calcite-button
            scale="s"
            appearance="outline-fill"
            icon-start="link"
            aria-label="Generate a thumbnail from an ArcGIS item or service URL"
            onClick={() => useUIStore.getState().openGenerate()}
          >
            From URL
          </calcite-button>

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

      {pendingProject ? (
        <calcite-dialog
          ref={warningDialogRef}
          open
          heading="Large editable project"
          description="Review before downloading"
          modal
          width-scale="s"
        >
          <calcite-notice kind="warning" open icon-start="exclamation-mark-triangle">
            <div slot="message">{pendingProject.warnings[0].message}</div>
          </calcite-notice>
          <calcite-button
            slot="footer-start"
            appearance="transparent"
            onClick={() => setPendingProject(null)}
          >
            Cancel
          </calcite-button>
          <calcite-button
            slot="footer-end"
            kind="brand"
            icon-start="download"
            onClick={confirmLargeProject}
          >
            Download anyway
          </calcite-button>
        </calcite-dialog>
      ) : null}
    </>
  );
}

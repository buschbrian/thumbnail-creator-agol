import { useCallback } from "react";
import { useEditorStore, pauseHistory, resumeHistory } from "../state/store";
import { useDomEvents } from "../hooks/useDomEvents";
import { useHistoryFlags } from "../hooks/useHistoryFlags";

function BrandMark(): React.ReactElement {
  return (
    <svg width="22" height="22" viewBox="0 0 16 16" aria-hidden="true">
      <rect width="16" height="16" rx="2.5" fill="#0079c1" />
      <path
        d="M4 11V6.5L7 4l3 2.5h3V11z"
        fill="#ffffff"
      />
    </svg>
  );
}

export function TopBar() {
  const doc = useEditorStore((s) => s.doc);
  const flags = useHistoryFlags();

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
        <strong>ArcGIS Thumbnail Maker</strong>
        <calcite-chip
          scale="s"
          kind="brand"
          appearance="outline-fill"
          label={`Canvas size ${doc.width} by ${doc.height} pixels`}
        >
          {doc.width} × {doc.height}
        </calcite-chip>
      </div>

      <calcite-input-text
        ref={titleRef}
        className="title-input"
        placeholder="Thumbnail title"
        aria-label="Thumbnail title used for export filename"
        value={doc.title}
        scale="s"
        max-length={80}
      />

      <div className="topbar-actions">
        <calcite-action
          icon="undo"
          text="Undo"
          text-enabled={false}
          disabled={!flags.canUndo}
          onClick={() => useEditorStore.temporal.getState().undo()}
        />
        <calcite-action
          icon="redo"
          text="Redo"
          disabled={!flags.canRedo}
          onClick={() => useEditorStore.temporal.getState().redo()}
        />
      </div>
    </div>
  );
}

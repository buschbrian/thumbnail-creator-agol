import { useMemo, useState } from "react";
import { ICON_CATALOG } from "../icons/generated/iconData";
import { useEditorStore } from "../state/store";
import { useUIStore } from "../ui/uiStore";
import { useDomEvents } from "../hooks/useDomEvents";

export function IconPickerModal() {
  const open = useUIStore((s) => s.iconPickerOpen);
  const replaceTargetId = useUIStore((s) => s.replaceIconTargetId);
  const closeIconPicker = useUIStore((s) => s.closeIconPicker);

  const [query, setQuery] = useState("");

  const addIcon = useEditorStore((s) => s.addIcon);
  const updateLayer = useEditorStore((s) => s.updateLayer);

  const searchRef = useDomEvents([
    [
      "calciteInputTextInput",
      (event) => setQuery((event.target as HTMLInputElement).value),
    ],
  ]);

  const dialogRef = useDomEvents([
    ["calciteDialogClose", () => closeIconPicker()],
  ]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ICON_CATALOG;
    return ICON_CATALOG.filter(
      (icon) =>
        icon.id.toLowerCase().includes(needle) ||
        icon.label.toLowerCase().includes(needle),
    );
  }, [query]);

  const choose = (iconId: string): void => {
    if (replaceTargetId) {
      updateLayer(replaceTargetId, { iconId });
    } else {
      addIcon(iconId);
    }
    closeIconPicker();
  };

  if (!open) return null;

  return (
    <calcite-dialog
      ref={dialogRef}
      open={open}
      heading={replaceTargetId ? "Replace icon" : "Pick an ArcGIS-style icon"}
      description={`${results.length} of ${ICON_CATALOG.length} icons`}
      modal
      width-scale="m"
    >
      <div className="picker-toolbar">
        <calcite-input-text
          ref={searchRef}
          scale="s"
          placeholder="Search icons…"
          aria-label="Search icons"
          icon="search"
          value={query}
        />
      </div>

      <div className="icon-grid" role="listbox" aria-label="Icon choices">
        {results.map((icon) => (
          <button
            key={icon.id}
            type="button"
            className="icon-cell"
            role="option"
            aria-label={`Add ${icon.label} icon`}
            title={icon.label}
            onClick={() => choose(icon.id)}
          >
            <svg viewBox="0 0 16 16" width="30" height="30" aria-hidden="true">
              {icon.paths.map((path, index) => (
                <path
                  key={index}
                  d={path.d}
                  fill="currentColor"
                  opacity={
                    path.opacity !== undefined ? parseFloat(path.opacity) : 1
                  }
                />
              ))}
            </svg>
          </button>
        ))}
        {results.length === 0 ? (
          <p className="empty-hint">No icons match “{query}”.</p>
        ) : null}
      </div>
    </calcite-dialog>
  );
}

import { lazy, Suspense, useEffect } from "react";
import { AlertHost } from "./panels/AlertHost";
import { EditorCanvas } from "./canvas/EditorCanvas";
import { ExportPanel } from "./panels/ExportPanel";
import { LayersList } from "./panels/LayersList";
import { LeftPanel } from "./panels/LeftPanel";
import { PropertiesPanel } from "./panels/PropertiesPanel";
import { TopBar } from "./panels/TopBar";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useEditorStore } from "./state/store";
import { useUIStore, type RightTab } from "./ui/uiStore";

const IconPickerModal = lazy(() =>
  import("./panels/IconPickerModal").then((m) => ({ default: m.IconPickerModal })),
);

const TAB_LABELS: Record<RightTab, string> = {
  layers: "Layers",
  properties: "Style",
  export: "Export",
};

function RightDock() {
  const rightTab = useUIStore((s) => s.rightTab);
  const setRightTab = useUIStore((s) => s.setRightTab);
  const selectedId = useEditorStore((s) => s.selectedId);

  useEffect(() => {
    if (selectedId) setRightTab("properties");
  }, [selectedId, setRightTab]);

  return (
    <div className="dock">
      <div role="tablist" aria-label="Editor panels" className="dock-tabs">
        {(Object.keys(TAB_LABELS) as RightTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={rightTab === tab}
            className={`dock-tab${rightTab === tab ? " is-active" : ""}`}
            onClick={() => setRightTab(tab)}
          >
            {TAB_LABELS[tab]}
            {tab === "properties" && selectedId ? (
              <span className="dock-dot" aria-hidden="true" />
            ) : null}
          </button>
        ))}
      </div>

      <div className="dock-body">
        <section hidden={rightTab !== "layers"} aria-label="Layers">
          <LayersList />
        </section>
        <section hidden={rightTab !== "properties"} aria-label="Layer properties">
          <PropertiesPanel />
        </section>
        <section hidden={rightTab !== "export"} aria-label="Export">
          <ExportPanel />
        </section>
      </div>
    </div>
  );
}

export function App() {
  useKeyboardShortcuts();

  const iconPickerOpen = useUIStore((s) => s.iconPickerOpen);

  return (
    <>
      <calcite-shell className="app-shell">
        <header slot="header">
          <TopBar />
        </header>

        <calcite-shell-panel
          slot="panel-start"
          width-scale="m"
          position="start"
          display-mode="float"
        >
          <LeftPanel />
        </calcite-shell-panel>

        <EditorCanvas />

        <calcite-shell-panel
          slot="panel-end"
          width-scale="m"
          position="end"
          display-mode="float"
        >
          <RightDock />
        </calcite-shell-panel>
      </calcite-shell>

      {iconPickerOpen ? (
        <Suspense fallback={null}>
          <IconPickerModal />
        </Suspense>
      ) : null}
      <AlertHost />
    </>
  );
}

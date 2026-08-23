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
import { useUIStore, type LeftTab, type RightTab } from "./ui/uiStore";

const IconPickerModal = lazy(() =>
  import("./panels/IconPickerModal").then((m) => ({ default: m.IconPickerModal })),
);

const RIGHT_TABS: Record<RightTab, string> = {
  layers: "Layers",
  properties: "Style",
  export: "Export",
};

const LEFT_TABS: Array<{ id: LeftTab; label: string; glyph: React.ReactNode }> = [
  {
    id: "templates",
    label: "Templates",
    glyph: (
      <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
        <rect x="1.5" y="2.5" width="5.4" height="5.4" rx="1" fill="currentColor" />
        <rect x="9.1" y="2.5" width="5.4" height="5.4" rx="1" fill="currentColor" opacity="0.45" />
        <rect x="1.5" y="9.1" width="5.4" height="4.4" rx="1" fill="currentColor" opacity="0.45" />
        <rect x="9.1" y="9.1" width="5.4" height="4.4" rx="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "elements",
    label: "Elements",
    glyph: (
      <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
        <circle cx="5" cy="5" r="3.1" fill="currentColor" />
        <rect x="8.6" y="8.6" width="5.4" height="5.4" rx="1.2" fill="currentColor" opacity="0.55" />
        <path d="M11.2 2.2l2.6 4.6H8.6z" fill="currentColor" opacity="0.75" />
      </svg>
    ),
  },
  {
    id: "text",
    label: "Text",
    glyph: (
      <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
        <path
          d="M2.5 3.5h11M8 3.5v9.5M5.8 13h4.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "background",
    label: "Canvas",
    glyph: (
      <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
        <rect x="1.8" y="1.8" width="12.4" height="12.4" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2.4 11.5 6 8l3 2.8 2.2-2 3 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="10.6" cy="5.4" r="1.3" fill="currentColor" />
      </svg>
    ),
  },
];

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
        {(Object.keys(RIGHT_TABS) as RightTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={rightTab === tab}
            className={`dock-tab${rightTab === tab ? " is-active" : ""}`}
            onClick={() => setRightTab(tab)}
          >
            {RIGHT_TABS[tab]}
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

function LeftRail() {
  const leftTab = useUIStore((s) => s.leftTab);
  const setLeftTab = useUIStore((s) => s.setLeftTab);

  return (
    <div className="rail-wrap">
      <nav className="rail" aria-label="Insert panels">
        {LEFT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`rail-btn${leftTab === tab.id ? " is-active" : ""}`}
            aria-pressed={leftTab === tab.id}
            aria-label={tab.label}
            title={tab.label}
            onClick={() => setLeftTab(tab.id)}
          >
            {tab.glyph}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
      <div className="rail-panel">
        <LeftPanel />
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
          <LeftRail />
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

import { AlertHost } from "./panels/AlertHost";
import { EditorCanvas } from "./canvas/EditorCanvas";
import { ExportPanel } from "./panels/ExportPanel";
import { IconPickerModal } from "./panels/IconPickerModal";
import { LayersList } from "./panels/LayersList";
import { LeftPanel } from "./panels/LeftPanel";
import { PropertiesPanel } from "./panels/PropertiesPanel";
import { TopBar } from "./panels/TopBar";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

export function App() {
  useKeyboardShortcuts();

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
          displayMode="float"
        >
          <LeftPanel />
        </calcite-shell-panel>

        <EditorCanvas />

        <calcite-shell-panel
          slot="panel-end"
          width-scale="m"
          position="end"
          displayMode="float"
        >
          <div className="panel-stack right-stack">
            <calcite-panel heading="Layers" scale="s">
              <LayersList />
            </calcite-panel>
            <calcite-panel heading="Properties" scale="s">
              <PropertiesPanel />
            </calcite-panel>
            <calcite-panel heading="Export" scale="s">
              <ExportPanel />
            </calcite-panel>
          </div>
        </calcite-shell-panel>
      </calcite-shell>

      <IconPickerModal />
      <AlertHost />
    </>
  );
}

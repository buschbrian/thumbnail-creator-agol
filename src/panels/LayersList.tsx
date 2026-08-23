import { useEditorStore } from "../state/store";
import type { Layer } from "../state/types";

const TYPE_LABELS: Record<Layer["type"], string> = {
  backgroundImage: "Background image",
  logo: "Logo",
  text: "Text",
  shape: "Shape",
  icon: "Icon",
};

export function LayersList() {
  const layers = useEditorStore((s) => s.layers);
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.select);
  const moveLayer = useEditorStore((s) => s.moveLayer);
  const removeLayer = useEditorStore((s) => s.removeLayer);
  const updateLayer = useEditorStore((s) => s.updateLayer);

  const ordered = [...layers].reverse();

  if (layers.length === 0) {
    return (
      <p className="empty-hint">
        No layers yet. Add text, a logo, or apply a template to get started.
      </p>
    );
  }

  const hasBackgroundImage = layers[0]?.type === "backgroundImage";
  const lowestMovableIndex = hasBackgroundImage ? 1 : 0;

  return (
    <calcite-list
      selection-mode="none"
      label="Layers, topmost first"
    >
      {ordered.map((layer) => {
        const stackIndex = layers.indexOf(layer);
        const canMoveUp = stackIndex < layers.length - 1;
        const canMoveDown = stackIndex > lowestMovableIndex;
        return (
        <calcite-list-item
          key={layer.id}
          label={layer.name || TYPE_LABELS[layer.type]}
          description={TYPE_LABELS[layer.type]}
          selected={selectedId === layer.id}
          onClick={() => select(layer.id)}
        >
          <calcite-action
            slot="actions-start"
            icon={layer.visible ? "view-visible" : "view-hide"}
            scale="s"
            text={
              layer.visible ? `Hide ${layer.name}` : `Show ${layer.name}`
            }
            onClick={(event: React.MouseEvent) => {
              event.stopPropagation();
              updateLayer(layer.id, { visible: !layer.visible });
            }}
          />
          <div slot="actions-end" className="row-actions">
            {layer.type !== "backgroundImage" ? (
              <>
                <calcite-action
                  icon="chevron-up"
                  scale="s"
                  text={`Move ${layer.name} up`}
                  disabled={!canMoveUp}
                  onClick={(event: React.MouseEvent) => {
                    event.stopPropagation();
                    moveLayer(layer.id, 1);
                  }}
                />
                <calcite-action
                  icon="chevron-down"
                  scale="s"
                  text={`Move ${layer.name} down`}
                  disabled={!canMoveDown}
                  onClick={(event: React.MouseEvent) => {
                    event.stopPropagation();
                    moveLayer(layer.id, -1);
                  }}
                />
              </>
            ) : null}
            <calcite-action
              icon="trash"
              scale="s"
              kind="danger"
              text={`Delete ${layer.name}`}
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                removeLayer(layer.id);
              }}
            />
          </div>
        </calcite-list-item>
        );
      })}
    </calcite-list>
  );
}

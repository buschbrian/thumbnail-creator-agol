import { Group, Image as KonvaImage, Path, Rect, Text as KonvaText } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { getFontCss } from "../constants";
import { useEditorStore } from "../state/store";
import { useUIStore } from "../ui/uiStore";
import { findIcon } from "../icons/generated/iconData";
import { useImage } from "./useImage";
import type {
  BackgroundImageLayer,
  IconLayer,
  Layer,
  LogoLayer,
  ShapeLayer,
  TextLayer,
} from "../state/types";
import type { FitMode } from "../state/types";

interface CommittedPosition {
  x: number;
  y: number;
}

function commitEnd(
  layerId: string,
  node: Konva.Node,
  extra: Record<string, unknown>,
): void {
  const patch: Record<string, unknown> = {
    x: Math.round(node.x()),
    y: Math.round(node.y()),
    rotation: Math.round(node.rotation() * 10) / 10,
    ...extra,
  };
  node.scale({ x: 1, y: 1 });
  useEditorStore.getState().updateLayer(layerId, patch);
}

function fitBox(
  naturalWidth: number,
  naturalHeight: number,
  boxWidth: number,
  boxHeight: number,
  mode: FitMode,
): { width: number; height: number; offsetX: number; offsetY: number } {
  if (mode === "stretch") {
    return { width: boxWidth, height: boxHeight, offsetX: 0, offsetY: 0 };
  }
  const scale =
    mode === "cover"
      ? Math.max(boxWidth / naturalWidth, boxHeight / naturalHeight)
      : Math.min(boxWidth / naturalWidth, boxHeight / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  return {
    width,
    height,
    offsetX: (boxWidth - width) / 2,
    offsetY: (boxHeight - height) / 2,
  };
}

function BackgroundImageNode({ layer }: { layer: BackgroundImageLayer }) {
  const doc = useEditorStore((s) => s.doc);
  const [image] = useImage(layer.src);

  if (!image) {
    return (
      <Rect
        id={layer.id}
        x={0}
        y={0}
        width={doc.width}
        height={doc.height}
        fill="#c9c9c9"
        listening={false}
      />
    );
  }

  const box = fitBox(
    image.naturalWidth,
    image.naturalHeight,
    doc.width,
    doc.height,
    layer.fit,
  );

  return (
    <KonvaImage
      id={layer.id}
      image={image}
      x={box.offsetX}
      y={box.offsetY}
      width={box.width}
      height={box.height}
      listening={false}
    />
  );
}

function TextNode({
  layer,
  onDragCommit,
  onTransformCommit,
}: {
  layer: TextLayer;
  onDragCommit: (id: string, pos: CommittedPosition) => void;
  onTransformCommit: (event: KonvaEventObject<Event>) => void;
}) {
  return (
    <KonvaText
      id={layer.id}
      x={layer.x}
      y={layer.y}
      rotation={layer.rotation ?? 0}
      opacity={layer.opacity}
      visible={layer.visible}
      draggable
      text={layer.text}
      fontFamily={getFontCss(layer.fontId)}
      fontSize={layer.fontSize}
      fontStyle={layer.italic ? "italic" : "normal"}
      fontWeight={String(layer.fontWeight)}
      fill={layer.color}
      align={layer.align}
      width={layer.width}
      lineHeight={layer.lineHeight}
      letterSpacing={layer.letterSpacing}
      onDragEnd={(event) =>
        onDragCommit(layer.id, {
          x: event.target.x(),
          y: event.target.y(),
        })
      }
      onTransformEnd={onTransformCommit}
    />
  );
}

export function LayerNode({ layer }: { layer: Layer }) {
  const select = useEditorStore((s) => s.select);
  const updateLayer = useEditorStore((s) => s.updateLayer);

  const onDragCommit = (id: string, pos: CommittedPosition): void => {
    updateLayer(id, { x: Math.round(pos.x), y: Math.round(pos.y) });
  };

  const onEditRequest = (id: string): void => {
    select(id);
    useUIStore.getState().setRightTab("properties");
  };

  if (layer.type === "backgroundImage") {
    return <BackgroundImageNode layer={layer} />;
  }

  const onTransformEnd = (event: KonvaEventObject<Event>): void => {
    const node = event.target;
    switch (layer.type) {
      case "text":
        commitEnd(layer.id, node, {
          width: Math.max(24, Math.round(node.width() * node.scaleX())),
        });
        break;
      case "shape":
        commitEnd(layer.id, node, {
          width: Math.max(8, Math.round(node.width() * node.scaleX())),
          height: Math.max(8, Math.round(node.height() * node.scaleY())),
        });
        break;
      case "logo":
        commitEnd(layer.id, node, {
          width: Math.max(12, Math.round(node.width() * node.scaleX())),
          height: Math.max(12, Math.round(node.height() * node.scaleY())),
        });
        break;
      case "icon":
        commitEnd(layer.id, node, {
          size: Math.max(
            12,
            Math.round(((node.scaleX() + node.scaleY()) / 2) * layer.size),
          ),
        });
        break;
    }
  };

  const common = {
    id: layer.id,
    x: layer.x,
    y: layer.y,
    rotation: layer.rotation ?? 0,
    opacity: layer.opacity,
    visible: layer.visible,
    draggable: true,
    onClick: () => select(layer.id),
    onTap: () => select(layer.id),
    onDblClick: () => onEditRequest(layer.id),
    onDblTap: () => onEditRequest(layer.id),
    onDragEnd: (event: KonvaEventObject<DragEvent>) =>
      onDragCommit(layer.id, { x: event.target.x(), y: event.target.y() }),
    onTransformEnd,
  };

  switch (layer.type) {
    case "text":
      return <TextNode layer={layer} onDragCommit={onDragCommit} onTransformCommit={onTransformEnd} />;

    case "shape": {
      const shape = layer as ShapeLayer;
      return (
        <Rect
          {...common}
          width={shape.width}
          height={shape.height}
          fill={shape.fill}
          cornerRadius={shape.cornerRadius}
        />
      );
    }

    case "logo": {
      const logo = layer as LogoLayer;
      return (
        <LogoNode logo={logo} common={common} />
      );
    }

    case "icon": {
      const icon = layer as IconLayer;
      const definition = findIcon(icon.iconId);
      const scaleTo = icon.size / 16;
      return (
        <Group
          {...common}
          scaleX={scaleTo}
          scaleY={scaleTo}
        >
          {(definition?.paths ?? []).map((path, index) => (
            <Path
              key={index}
              data={path.d}
              fill={icon.color}
              opacity={path.opacity !== undefined ? parseFloat(path.opacity) : 1}
            />
          ))}
        </Group>
      );
    }
  }
}

function LogoNode({
  logo,
  common,
}: {
  logo: LogoLayer;
  common: Record<string, unknown>;
}) {
  const [image] = useImage(logo.src);
  return (
    <Group {...common}>
      {image ? (
        <KonvaImage image={image} width={logo.width} height={logo.height} />
      ) : (
        <Rect width={logo.width} height={logo.height} fill="#d0d0d0" />
      )}
    </Group>
  );
}

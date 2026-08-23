import { Group, Layer, Path, Rect, Stage, Text } from "react-konva";
import { useMemo } from "react";
import { findIcon } from "../icons/generated/iconData";
import { getFontCss } from "../constants";
import type { DocumentSpec, LayerDraft } from "../state/types";

function DraftIcon({
  iconId,
  size,
  color,
  x,
  y,
  opacity,
}: {
  iconId: string;
  size: number;
  color: string;
  x: number;
  y: number;
  opacity: number;
}) {
  const definition = findIcon(iconId);
  const scaleTo = size / 16;
  return (
    <Group x={x} y={y} opacity={opacity} scaleX={scaleTo} scaleY={scaleTo}>
      {(definition?.paths ?? []).map((path, index) => (
        <Path
          key={index}
          data={path.d}
          fill={color}
          opacity={path.opacity !== undefined ? parseFloat(path.opacity) : 1}
        />
      ))}
    </Group>
  );
}

function DraftNode({ draft }: { draft: LayerDraft }) {
  switch (draft.type) {
    case "shape":
      return (
        <Rect
          x={draft.x}
          y={draft.y}
          width={draft.width}
          height={draft.height}
          fill={draft.fill}
          cornerRadius={draft.cornerRadius}
          opacity={draft.opacity}
          listening={false}
        />
      );
    case "text":
      return (
        <Text
          x={draft.x}
          y={draft.y}
          text={draft.text}
          fontFamily={getFontCss(draft.fontId)}
          fontSize={draft.fontSize}
          fontStyle={draft.italic ? "italic" : "normal"}
          fontWeight={String(draft.fontWeight)}
          fill={draft.color}
          align={draft.align}
          width={draft.width}
          lineHeight={draft.lineHeight}
          letterSpacing={draft.letterSpacing}
          opacity={draft.opacity}
          listening={false}
        />
      );
    case "icon":
      return (
        <DraftIcon
          iconId={draft.iconId}
          size={draft.size}
          color={draft.color}
          x={draft.x}
          y={draft.y}
          opacity={draft.opacity}
        />
      );
    default:
      return null;
  }
}

const PREVIEW_WIDTH = 96;

export function TemplateThumb({
  drafts,
  doc,
}: {
  drafts: LayerDraft[];
  doc: DocumentSpec;
}) {
  const scale = PREVIEW_WIDTH / doc.width;
  const height = Math.round(doc.height * scale);
  const memoDrafts = useMemo(() => drafts, [drafts]);

  return (
    <Stage width={PREVIEW_WIDTH} height={height} scale={{ x: scale, y: scale }}>
      <Layer listening={false}>
        <Rect width={doc.width} height={doc.height} fill="#efece7" />
        {memoDrafts.map((draft, index) => (
          <DraftNode key={index} draft={draft} />
        ))}
      </Layer>
    </Stage>
  );
}

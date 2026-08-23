import { useEffect, useRef, useState } from "react";
import { Layer, Line, Rect, Stage, Transformer } from "react-konva";
import type Konva from "konva";
import { useEditorStore } from "../state/store";
import { useUIStore } from "../ui/uiStore";
import { stageRef } from "./stageRef";
import { useFitScale } from "./useFitScale";
import { LayerNode } from "./LayerNode";

const SNAP_THRESHOLD_PX = 6;
const ACCENT = "#e8400d";
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.25;

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function EditorCanvas() {
  const doc = useEditorStore((s) => s.doc);
  const backgroundColor = useEditorStore((s) => s.backgroundColor);
  const layers = useEditorStore((s) => s.layers);
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.select);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageLocalRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const snapVRef = useRef<Konva.Line>(null);
  const snapHRef = useRef<Konva.Line>(null);

  const fitScale = useFitScale(wrapRef, doc.width, doc.height);
  const [zoom, setZoom] = useState<"fit" | number>("fit");
  const scale = zoom === "fit" ? fitScale : zoom;

  useEffect(() => {
    const stage = stageLocalRef.current;
    stageRef.current = stage;
    return () => {
      if (stageRef.current === stage) stageRef.current = null;
    };
  }, []);

  const selectedLayer = layers.find((l) => l.id === selectedId);
  const selectable =
    selectedLayer && selectedLayer.type !== "backgroundImage"
      ? selectedLayer
      : undefined;

  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageLocalRef.current;
    if (!transformer || !stage) return;

    if (!selectable) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    const node = stage.findOne(`#${selectable.id}`) ?? null;
    if (!node) {
      transformer.nodes([]);
      return;
    }

    switch (selectable.type) {
      case "text":
        transformer.enabledAnchors(["middle-left", "middle-right"]);
        transformer.rotateEnabled(true);
        transformer.keepRatio(false);
        break;
      case "shape":
        transformer.enabledAnchors([
          "top-left",
          "top-center",
          "top-right",
          "middle-left",
          "middle-right",
          "bottom-left",
          "bottom-center",
          "bottom-right",
        ]);
        transformer.rotateEnabled(true);
        transformer.keepRatio(false);
        break;
      case "logo":
      case "icon":
        transformer.enabledAnchors([
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
        ]);
        transformer.rotateEnabled(true);
        transformer.keepRatio(true);
        break;
    }

    transformer.nodes([node]);
    transformer.getLayer()?.batchDraw();
  }, [selectable, scale, layers]);

  useEffect(() => {
    const stage = stageLocalRef.current;
    if (!stage) return;

    const threshold = SNAP_THRESHOLD_PX / scale;

    const hideSnaps = (): void => {
      snapVRef.current?.visible(false);
      snapHRef.current?.visible(false);
    };

    const onDragMove = (event: Konva.KonvaEventObject<DragEvent>): void => {
      const node = event.target as Konva.Node;
      if (node.getLayer()?.name() === "guides") return;
      hideSnaps();

      const box = node.getClientRect({ relativeTo: stage });
      let snappedV: number | null = null;
      let snappedH: number | null = null;

      const verticalTargets = [0, doc.width / 2, doc.width];
      for (const target of verticalTargets) {
        const boxCenter = box.x + box.width / 2;
        const boxLeft = box.x;
        const boxRight = box.x + box.width;
        if (Math.abs(boxLeft - target) < threshold) {
          node.x(node.x() + (target - boxLeft));
          snappedV = target;
          break;
        }
        if (Math.abs(boxCenter - target) < threshold) {
          node.x(node.x() + (target - boxCenter));
          snappedV = target;
          break;
        }
        if (Math.abs(boxRight - target) < threshold) {
          node.x(node.x() + (target - boxRight));
          snappedV = target;
          break;
        }
      }

      const horizontalTargets = [0, doc.height / 2, doc.height];
      for (const target of horizontalTargets) {
        const boxMiddle = box.y + box.height / 2;
        const boxTop = box.y;
        const boxBottom = box.y + box.height;
        if (Math.abs(boxTop - target) < threshold) {
          node.y(node.y() + (target - boxTop));
          snappedH = target;
          break;
        }
        if (Math.abs(boxMiddle - target) < threshold) {
          node.y(node.y() + (target - boxMiddle));
          snappedH = target;
          break;
        }
        if (Math.abs(boxBottom - target) < threshold) {
          node.y(node.y() + (target - boxBottom));
          snappedH = target;
          break;
        }
      }

      if (snappedV !== null) {
        snapVRef.current?.points([snappedV, 0, snappedV, doc.height]);
        snapVRef.current?.visible(true);
      }
      if (snappedH !== null) {
        snapHRef.current?.points([0, snappedH, doc.width, snappedH]);
        snapHRef.current?.visible(true);
      }
    };

    stage.on("dragmove", onDragMove);
    stage.on("dragend", hideSnaps);
    return () => {
      stage.off("dragmove", onDragMove);
      stage.off("dragend", hideSnaps);
    };
  }, [scale, doc.width, doc.height]);

  const isEmpty = layers.length === 0;

  return (
    <div
      ref={wrapRef}
      className={`canvas-wrap${zoom === "fit" ? "" : " is-zoomed"}`}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;
        const url = URL.createObjectURL(file);
        useEditorStore.getState().setBackgroundImage(url);
        useUIStore.getState().pushAlert("success", "Background added", file.name);
      }}
    >
      {isEmpty ? (
        <div className="canvas-empty">
          <h2>Make your item stand out</h2>
          <p>
            Start with a template, then add a background photo and your title.
          </p>
          <div className="canvas-empty-actions">
            <calcite-button
              scale="s"
              kind="brand"
              onClick={() =>
                useEditorStore.getState().applyTemplate("footer-dark")
              }
            >
              Use a template
            </calcite-button>
            <calcite-button
              scale="s"
              appearance="outline-fill"
              onClick={() => useEditorStore.getState().addText()}
            >
              Add title text
            </calcite-button>
          </div>
        </div>
      ) : null}

      <div
        className="canvas-frame"
        style={{
          width: Math.round(doc.width * scale),
          height: Math.round(doc.height * scale),
        }}
      >
        <Stage
          ref={stageLocalRef}
          width={Math.round(doc.width * scale)}
          height={Math.round(doc.height * scale)}
          scale={{ x: scale, y: scale }}
          onMouseDown={(event) => {
            if (event.target === event.target.getStage()) select(null);
          }}
          onTouchStart={(event) => {
            if (event.target === event.target.getStage()) select(null);
          }}
        >
          <Layer name="content">
            <Rect
              id="bg-fill"
              listening={false}
              width={doc.width}
              height={doc.height}
              fill={backgroundColor}
            />
            {layers.map((layer) => (
              <LayerNode key={layer.id} layer={layer} />
            ))}
          </Layer>
          <Layer name="guides">
            <Line
              ref={snapVRef}
              visible={false}
              listening={false}
              stroke={ACCENT}
              strokeWidth={1 / scale}
              dash={[4 / scale, 4 / scale]}
              points={[0, 0, 0, doc.height]}
            />
            <Line
              ref={snapHRef}
              visible={false}
              listening={false}
              stroke={ACCENT}
              strokeWidth={1 / scale}
              dash={[4 / scale, 4 / scale]}
              points={[0, 0, doc.width, 0]}
            />
            <Transformer
              ref={transformerRef}
              anchorSize={10 / scale}
              anchorCornerRadius={2 / scale}
              anchorStroke={ACCENT}
              anchorFill="#ffffff"
              anchorStrokeWidth={1.5 / scale}
              borderStroke={ACCENT}
              borderStrokeWidth={1 / scale}
              rotateAnchorOffset={26 / scale}
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < 12 || newBox.height < 12 ? oldBox : newBox
              }
            />
          </Layer>
        </Stage>
      </div>

      <div className="zoom-pill" role="group" aria-label="Zoom controls">
        <button
          type="button"
          className="icon-btn"
          aria-label="Zoom out"
          disabled={scale <= MIN_ZOOM + 0.001}
          onClick={() =>
            setZoom(clampZoom((zoom === "fit" ? fitScale : zoom) / ZOOM_STEP))
          }
        >
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
            <path d="M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <span className="zoom-value">{Math.round(scale * 100)}%</span>
        <button
          type="button"
          className="icon-btn"
          aria-label="Zoom in"
          disabled={scale >= MAX_ZOOM - 0.001}
          onClick={() =>
            setZoom(clampZoom((zoom === "fit" ? fitScale : zoom) * ZOOM_STEP))
          }
        >
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <span className="zoom-sep" aria-hidden="true" />
        <span className="zoom-dims">
          {doc.width} × {doc.height}
        </span>
        {zoom !== "fit" ? (
          <button
            type="button"
            className="fit-btn"
            aria-label="Fit canvas to view"
            onClick={() => setZoom("fit")}
          >
            Fit
          </button>
        ) : null}
      </div>
    </div>
  );
}

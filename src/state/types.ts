export type FitMode = "cover" | "contain" | "stretch";

export interface BaseLayer {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation?: number;
  opacity: number;
  visible: boolean;
}

export interface BackgroundImageLayer extends BaseLayer {
  type: "backgroundImage";
  src: string;
  fit: FitMode;
}

export interface LogoLayer extends BaseLayer {
  type: "logo";
  src: string;
  width: number;
  height: number;
}

export interface TextLayer extends BaseLayer {
  type: "text";
  text: string;
  fontId: string;
  fontSize: number;
  fontWeight: 400 | 600 | 700;
  italic: boolean;
  color: string;
  align: "left" | "center" | "right";
  width: number;
  lineHeight: number;
  letterSpacing: number;
}

export interface ShapeLayer extends BaseLayer {
  type: "shape";
  shape: "rectangle";
  width: number;
  height: number;
  fill: string;
  cornerRadius: number;
}

export interface IconLayer extends BaseLayer {
  type: "icon";
  iconId: string;
  size: number;
  color: string;
}

export type Layer =
  | BackgroundImageLayer
  | LogoLayer
  | TextLayer
  | ShapeLayer
  | IconLayer;

export interface DocumentSpec {
  width: number;
  height: number;
  title: string;
  itemType?: string;
  altTextOverride?: string;
}

/** The complete design data tracked by editor history and portable snapshots. */
export interface DesignState {
  doc: DocumentSpec;
  backgroundColor: string;
  layers: Layer[];
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

export type LayerDraft = DistributiveOmit<Layer, "id">;

export interface ImageMeasurements {
  naturalWidth: number;
  naturalHeight: number;
}

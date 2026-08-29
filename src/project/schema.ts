import type {
  BaseLayer,
  DesignState,
  DocumentSpec,
  Layer,
} from "../state/types";

export const DESIGN_SNAPSHOT_FORMAT = "thumbnail-maker-design" as const;
export const DESIGN_SNAPSHOT_VERSION = 1 as const;

export interface DesignSnapshotV1 extends DesignState {
  format: typeof DESIGN_SNAPSHOT_FORMAT;
  version: typeof DESIGN_SNAPSHOT_VERSION;
}

export type DesignSnapshot = DesignSnapshotV1;

export class DesignSnapshotValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid design snapshot: ${issues.join("; ")}`);
    this.name = "DesignSnapshotValidationError";
    this.issues = [...issues];
  }
}

const COLOR_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const LAYER_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const EMBEDDED_RASTER_RE =
  /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/i;
const MIN_DOCUMENT_DIMENSION = 50;
const MAX_DOCUMENT_DIMENSION = 8000;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateString(
  value: unknown,
  path: string,
  issues: string[],
  options: { maxLength: number; nonEmpty?: boolean },
): void {
  if (
    typeof value !== "string" ||
    value.length > options.maxLength ||
    (options.nonEmpty === true && value.length === 0)
  ) {
    issues.push(`${path} must be a${options.nonEmpty ? " non-empty" : ""} string of at most ${options.maxLength} characters`);
  }
}

function validateOptionalString(
  value: unknown,
  path: string,
  issues: string[],
  maxLength: number,
): void {
  if (value !== undefined) {
    validateString(value, path, issues, { maxLength });
  }
}

function validateFiniteNumber(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.push(`${path} must be a finite number`);
  }
}

function validatePositiveNumber(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    issues.push(`${path} must be a positive finite number`);
  }
}

function validateColor(value: unknown, path: string, issues: string[]): void {
  if (typeof value !== "string" || !COLOR_RE.test(value)) {
    issues.push(`${path} must be a CSS hex color`);
  }
}

function validateImageSource(
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (typeof value !== "string" || !EMBEDDED_RASTER_RE.test(value)) {
    issues.push(`${path} must be an embedded PNG, JPEG, or WebP data URL`);
  }
}

function validateDocument(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("doc must be an object");
    return;
  }

  for (const dimension of ["width", "height"] as const) {
    const candidate = value[dimension];
    if (
      typeof candidate !== "number" ||
      !Number.isInteger(candidate) ||
      candidate < MIN_DOCUMENT_DIMENSION ||
      candidate > MAX_DOCUMENT_DIMENSION
    ) {
      issues.push(
        `doc.${dimension} must be an integer from ${MIN_DOCUMENT_DIMENSION} to ${MAX_DOCUMENT_DIMENSION}`,
      );
    }
  }

  validateString(value.title, "doc.title", issues, { maxLength: 80 });
  validateOptionalString(value.itemType, "doc.itemType", issues, 200);
  validateOptionalString(
    value.altTextOverride,
    "doc.altTextOverride",
    issues,
    4000,
  );
}

function validateBaseLayer(
  layer: UnknownRecord,
  path: string,
  issues: string[],
): void {
  if (typeof layer.id !== "string" || !LAYER_ID_RE.test(layer.id)) {
    issues.push(`${path}.id must be a safe layer identifier`);
  }
  validateString(layer.name, `${path}.name`, issues, { maxLength: 120 });
  validateFiniteNumber(layer.x, `${path}.x`, issues);
  validateFiniteNumber(layer.y, `${path}.y`, issues);
  if (layer.rotation !== undefined) {
    validateFiniteNumber(layer.rotation, `${path}.rotation`, issues);
  }
  if (
    typeof layer.opacity !== "number" ||
    !Number.isFinite(layer.opacity) ||
    layer.opacity < 0 ||
    layer.opacity > 1
  ) {
    issues.push(`${path}.opacity must be a finite number from 0 to 1`);
  }
  if (typeof layer.visible !== "boolean") {
    issues.push(`${path}.visible must be a boolean`);
  }
}

function validateLayer(
  value: unknown,
  index: number,
  issues: string[],
): void {
  const path = `layers[${index}]`;
  if (!isRecord(value)) {
    issues.push(`${path} must be an object`);
    return;
  }

  validateBaseLayer(value, path, issues);

  switch (value.type) {
    case "backgroundImage":
      validateImageSource(value.src, `${path}.src`, issues);
      if (!(["cover", "contain", "stretch"] as const).includes(value.fit as never)) {
        issues.push(`${path}.fit must be cover, contain, or stretch`);
      }
      break;
    case "logo":
      validateImageSource(value.src, `${path}.src`, issues);
      validatePositiveNumber(value.width, `${path}.width`, issues);
      validatePositiveNumber(value.height, `${path}.height`, issues);
      break;
    case "text":
      validateString(value.text, `${path}.text`, issues, { maxLength: 10_000 });
      validateString(value.fontId, `${path}.fontId`, issues, {
        maxLength: 128,
        nonEmpty: true,
      });
      validatePositiveNumber(value.fontSize, `${path}.fontSize`, issues);
      if (![400, 600, 700].includes(value.fontWeight as number)) {
        issues.push(`${path}.fontWeight must be 400, 600, or 700`);
      }
      if (typeof value.italic !== "boolean") {
        issues.push(`${path}.italic must be a boolean`);
      }
      validateColor(value.color, `${path}.color`, issues);
      if (!(["left", "center", "right"] as const).includes(value.align as never)) {
        issues.push(`${path}.align must be left, center, or right`);
      }
      validatePositiveNumber(value.width, `${path}.width`, issues);
      validatePositiveNumber(value.lineHeight, `${path}.lineHeight`, issues);
      validateFiniteNumber(value.letterSpacing, `${path}.letterSpacing`, issues);
      break;
    case "shape":
      if (value.shape !== "rectangle") {
        issues.push(`${path}.shape must be rectangle`);
      }
      validatePositiveNumber(value.width, `${path}.width`, issues);
      validatePositiveNumber(value.height, `${path}.height`, issues);
      validateColor(value.fill, `${path}.fill`, issues);
      if (
        typeof value.cornerRadius !== "number" ||
        !Number.isFinite(value.cornerRadius) ||
        value.cornerRadius < 0
      ) {
        issues.push(`${path}.cornerRadius must be a non-negative finite number`);
      }
      break;
    case "icon":
      validateString(value.iconId, `${path}.iconId`, issues, {
        maxLength: 128,
        nonEmpty: true,
      });
      validatePositiveNumber(value.size, `${path}.size`, issues);
      validateColor(value.color, `${path}.color`, issues);
      break;
    default:
      issues.push(`${path}.type is not a supported layer type`);
  }
}

function validateLayers(value: unknown, issues: string[]): void {
  if (!Array.isArray(value)) {
    issues.push("layers must be an array");
    return;
  }

  value.forEach((layer, index) => validateLayer(layer, index, issues));

  const seen = new Set<string>();
  value.forEach((layer, index) => {
    if (!isRecord(layer) || typeof layer.id !== "string") return;
    if (seen.has(layer.id)) {
      issues.push(`layers[${index}].id must be unique`);
    }
    seen.add(layer.id);
  });
}

function cloneDocument(doc: DocumentSpec): DocumentSpec {
  return {
    width: doc.width,
    height: doc.height,
    title: doc.title,
    ...(doc.itemType === undefined ? {} : { itemType: doc.itemType }),
    ...(doc.altTextOverride === undefined
      ? {}
      : { altTextOverride: doc.altTextOverride }),
  };
}

function cloneBaseLayer(layer: BaseLayer): BaseLayer {
  return {
    id: layer.id,
    name: layer.name,
    x: layer.x,
    y: layer.y,
    ...(layer.rotation === undefined ? {} : { rotation: layer.rotation }),
    opacity: layer.opacity,
    visible: layer.visible,
  };
}

function cloneLayer(layer: Layer): Layer {
  const base = cloneBaseLayer(layer);
  switch (layer.type) {
    case "backgroundImage":
      return { ...base, type: layer.type, src: layer.src, fit: layer.fit };
    case "logo":
      return {
        ...base,
        type: layer.type,
        src: layer.src,
        width: layer.width,
        height: layer.height,
      };
    case "text":
      return {
        ...base,
        type: layer.type,
        text: layer.text,
        fontId: layer.fontId,
        fontSize: layer.fontSize,
        fontWeight: layer.fontWeight,
        italic: layer.italic,
        color: layer.color,
        align: layer.align,
        width: layer.width,
        lineHeight: layer.lineHeight,
        letterSpacing: layer.letterSpacing,
      };
    case "shape":
      return {
        ...base,
        type: layer.type,
        shape: layer.shape,
        width: layer.width,
        height: layer.height,
        fill: layer.fill,
        cornerRadius: layer.cornerRadius,
      };
    case "icon":
      return {
        ...base,
        type: layer.type,
        iconId: layer.iconId,
        size: layer.size,
        color: layer.color,
      };
  }
}

function cloneDesignState(state: DesignState): DesignState {
  return {
    doc: cloneDocument(state.doc),
    backgroundColor: state.backgroundColor,
    layers: state.layers.map(cloneLayer),
  };
}

/** Creates a detached v1 snapshot from trusted in-memory editor state. */
export function createDesignSnapshot(state: DesignState): DesignSnapshotV1 {
  return {
    format: DESIGN_SNAPSHOT_FORMAT,
    version: DESIGN_SNAPSHOT_VERSION,
    ...cloneDesignState(state),
  };
}

/** Validates and sanitizes an untrusted external snapshot. */
export function parseDesignSnapshot(value: unknown): DesignSnapshot {
  const issues: string[] = [];
  if (!isRecord(value)) {
    throw new DesignSnapshotValidationError(["snapshot must be an object"]);
  }

  if (value.format !== DESIGN_SNAPSHOT_FORMAT) {
    issues.push(`format must be ${DESIGN_SNAPSHOT_FORMAT}`);
  }
  if (value.version !== DESIGN_SNAPSHOT_VERSION) {
    issues.push(`version must be ${DESIGN_SNAPSHOT_VERSION}`);
  }
  validateDocument(value.doc, issues);
  validateColor(value.backgroundColor, "backgroundColor", issues);
  validateLayers(value.layers, issues);

  if (issues.length > 0) {
    throw new DesignSnapshotValidationError(issues);
  }

  return createDesignSnapshot(value as unknown as DesignState);
}

/** Returns detached editor/history data ready for an atomic store transition. */
export function designStateFromSnapshot(snapshot: DesignSnapshot): DesignState {
  return cloneDesignState(snapshot);
}

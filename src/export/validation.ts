import { SIZE_PRESETS } from "../presets/presets";

export type WarningCode =
  | "UNCOMMON_SIZE"
  | "EXTREME_ASPECT"
  | "VERY_SMALL"
  | "VERY_LARGE";

export interface ExportWarning {
  code: WarningCode;
  message: string;
}

const MIN_REASONABLE_DIMENSION = 200;
const MAX_REASONABLE_DIMENSION = 4096;
const EXTREME_ASPECT_RATIO = 3;

export function validateDimensions(width: number, height: number): ExportWarning[] {
  const warnings: ExportWarning[] = [];

  const matchesPreset = SIZE_PRESETS.some(
    (p) => p.width === width && p.height === height,
  );
  if (!matchesPreset) {
    warnings.push({
      code: "UNCOMMON_SIZE",
      message: `${width} × ${height} is an unusual size for ArcGIS Online thumbnails. Consider 600 × 400.`,
    });
  }

  const aspect = width / height;
  if (aspect > EXTREME_ASPECT_RATIO || aspect < 1 / EXTREME_ASPECT_RATIO) {
    warnings.push({
      code: "EXTREME_ASPECT",
      message:
        "This aspect ratio is extreme. ArcGIS Online crops thumbnails unpredictably at unusual ratios.",
    });
  }

  if (width < MIN_REASONABLE_DIMENSION || height < MIN_REASONABLE_DIMENSION) {
    warnings.push({
      code: "VERY_SMALL",
      message: "Very small dimensions will look blurry or pixelated.",
    });
  }

  if (width > MAX_REASONABLE_DIMENSION || height > MAX_REASONABLE_DIMENSION) {
    warnings.push({
      code: "VERY_LARGE",
      message: "Very large dimensions create big downloads and offer little benefit.",
    });
  }

  return warnings;
}

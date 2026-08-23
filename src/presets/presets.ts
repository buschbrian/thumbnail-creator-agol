export interface SizePreset {
  id: string;
  label: string;
  description: string;
  width: number;
  height: number;
}

export const SIZE_PRESETS: readonly SizePreset[] = [
  {
    id: "agol",
    label: "ArcGIS Online",
    description: "Default item thumbnail · 600 × 400",
    width: 600,
    height: 400,
  },
  {
    id: "square",
    label: "Square",
    description: "Square layout · 400 × 400",
    width: 400,
    height: 400,
  },
  {
    id: "highres",
    label: "High resolution",
    description: "Large detail · 1200 × 800",
    width: 1200,
    height: 800,
  },
];

export function matchingSizePreset(width: number, height: number): SizePreset | undefined {
  return SIZE_PRESETS.find((p) => p.width === width && p.height === height);
}

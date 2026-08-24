export interface BrandColor {
  hex: string;
  name?: string;
}

export interface BrandLogo {
  src: string;
  width: number;
  height: number;
}

export interface BrandKitFile {
  format: "thumbnail-maker-brandkit";
  version: 1;
  name?: string;
  colors?: ReadonlyArray<BrandColor | string>;
  logo?: BrandLogo | null;
}

export const BRAND_STORAGE_KEY = "thumbnail-maker.brandkit.v1";

export const MAX_BRAND_COLORS = 64;

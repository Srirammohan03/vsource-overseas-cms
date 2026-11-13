export interface Gallery {
  id?: number;
  title: string;
  subheading: string;
  blocks: Blocks[];
}

export interface Students {
  id?: number;
  card_title: string;
  card_title1: string;
  students_images: StudentImage[];
}

export interface Blocks {
  id?: number;
  __component: string;
  title?: string;
  subheading?: string;
  view360url?: string;
  journey_images?: StudentImage[];
}

export interface Images {
  id: number;
  url: string;
  name: string;
  alternativeText?: string;
}

export interface StudentImage {
  id: number | string;
  name: string;
  url: string;
  mimeType?: string;
  category?: string;
  formats?: ImageFormats;
}

export interface ImageFormats {
  small?: ImageFormat;
  medium?: ImageFormat;
  thumbnail?: ImageFormat;
}

export interface ImageFormat {
  url: string;
  width: number;
  height: number;
}

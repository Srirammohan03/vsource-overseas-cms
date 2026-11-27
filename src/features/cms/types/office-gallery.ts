import type { CMSStatus, MediaAsset } from "./index";

export const officeBranchValues = [
  "DILSUKNAGAR",
  "JNTU",
  "VIJAYAWADA",
] as const;
export type OfficeBranch = (typeof officeBranchValues)[number];
export const officeBranches: { value: OfficeBranch; label: string }[] = [
  { value: "DILSUKNAGAR", label: "Dilsuknagar" },
  { value: "JNTU", label: "JNTU" },
  { value: "VIJAYAWADA", label: "Vijayawada" },
];

export const officeAreaValues = [
  "COUNSELING_AREA",
  "APPLICATION_PROCESSING_UK",
  "CAFETERIA",
] as const;
export type OfficeArea = (typeof officeAreaValues)[number];
export const officeAreas: { value: OfficeArea; label: string }[] = [
  { value: "COUNSELING_AREA", label: "Counseling Area" },
  { value: "APPLICATION_PROCESSING_UK", label: "Application Processing - UK" },
  { value: "CAFETERIA", label: "Cafeteria" },
];

export type OfficeGalleryImage = {
  id: string;
  url: string;
  altText: string;
  mimeType: string;
  order: number;
};

export type OfficeGalleryRecord = {
  id: string;
  branch: OfficeBranch;
  area: OfficeArea;
  status: CMSStatus;
  media: {
    mediaId: string;
    order: number;
    media: MediaAsset | null;
  }[];
};

export type PublicOfficeGalleryRecord = {
  id: string;
  branch: OfficeBranch;
  area: OfficeArea;
  images: OfficeGalleryImage[];
};

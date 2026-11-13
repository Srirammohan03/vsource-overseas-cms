export type CMSStatus = "DRAFT" | "PUBLISHED";
export type MediaAsset = { id: string; url: string; thumbnailPath?: string | null; mimeType: string; name: string; altText?: string };
export type ContentRecord = Record<string, any>;

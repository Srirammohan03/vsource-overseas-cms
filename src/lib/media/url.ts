// Vsource-frontend\src\lib\media\url.ts
export function mediaUrl(value?: string | null) {
  if (!value) return "";
  return value.startsWith("/") ? value : `/media/${value}`;
}

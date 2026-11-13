export function mediaUrl(value?: string | null) {
  if (!value) return "";
  return value.startsWith("/") ? value : `/media/${value}`;
}

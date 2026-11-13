export const ENQUIRY_TIME_ZONE = "Asia/Kolkata";

export function formatEnquiryDateTimeIST(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) return "—";

  const datePart = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: ENQUIRY_TIME_ZONE,
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: ENQUIRY_TIME_ZONE,
  }).format(date);

  return `${datePart} at ${timePart}`;
}

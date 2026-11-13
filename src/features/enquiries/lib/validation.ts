import { z } from "zod";

export const enquiryServices = ["Masters in abroad", "Education Loan Guidance"] as const;
export const enquiryStatuses = ["NEW", "CONTACTED", "IN_PROGRESS", "CONVERTED", "CLOSED"] as const;

export const publicEnquirySchema = z.object({
  studentName: z.string().trim().min(2, "Enter your name.").max(120, "Name must be 120 characters or fewer.")
    .refine(value => /\p{L}/u.test(value), "Enter a valid name."),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  serviceRequired: z.enum(enquiryServices, { errorMap: () => ({ message: "Select a valid service." }) }),
  submissionKey: z.string().uuid("Invalid submission token.").optional(),
});

export const enquiryStatusSchema = z.object({
  status: z.enum(enquiryStatuses),
});

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, "Use a valid date in YYYY-MM-DD format.");

export const enquiryListQuerySchema = z.object({
  search: z.string().trim().max(160).optional().default(""),
  service: z.enum(enquiryServices).optional(),
  status: z.enum(enquiryStatuses).optional(),
  from: dateOnlySchema.optional(),
  to: dateOnlySchema.optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  format: z.enum(["json", "csv"]).default("json"),
}).refine(value => !value.from || !value.to || value.from <= value.to, {
  path: ["to"], message: "End date must be on or after start date.",
});

export function istDateRange(from?: string, to?: string) {
  // India has no daylight-saving transitions; these offsets represent local-day boundaries.
  return {
    ...(from ? { gte: new Date(`${from}T00:00:00.000+05:30`) } : {}),
    ...(to ? { lt: new Date(new Date(`${to}T00:00:00.000+05:30`).valueOf() + 86_400_000) } : {}),
  };
}

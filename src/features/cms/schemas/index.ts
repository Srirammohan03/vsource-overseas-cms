import { z } from "zod";
import { officeAreaValues, officeBranchValues } from "../types/office-gallery";

export const statusSchema = z.enum(["DRAFT", "PUBLISHED"]);
const slug = z.string().trim().min(1, "Slug is required.").max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens.");
const optionalText = z.string().trim().max(10000).nullish().transform(value => value ?? "").default("");
const imageSchema = z.object({ url: z.string().trim().max(1000).optional().default(""), alternativeText: z.string().max(500).optional().default("") }).nullable().optional();
const pairSchema = z.object({ label: optionalText, value: optionalText }).passthrough();
const linkSchema = z.object({ title: z.string().trim().min(1).max(100), href: z.string().trim().min(1).max(300) });
const destinationContentSchema = z.object({
  banner: imageSchema,
  quickLinks: z.array(linkSchema).max(20).default([]),
  overview: z.object({ title: optionalText, description: optionalText, highlights: z.array(pairSchema).max(40).default([]) }).passthrough().default({ title: "", description: "", highlights: [] }),
  whyStudyin: z.object({ title: optionalText, description: optionalText, highlights_points: z.array(z.object({ description: optionalText }).passthrough()).max(40).default([]), whyStudyin_cards: z.array(z.object({ title: optionalText, description: optionalText }).passthrough()).max(30).default([]) }).passthrough().default({ title: "", description: "", highlights_points: [], whyStudyin_cards: [] }),
  Living_Cost_Tuition_Fee: z.object({ title: optionalText, cities: z.array(z.object({ city: optionalText, description: optionalText, image: imageSchema, tables: z.array(z.object({ title: optionalText, label_values: z.array(pairSchema).max(100).default([]) }).passthrough()).max(20).default([]) }).passthrough()).max(100).default([]) }).passthrough().default({ title: "", cities: [] }),
  admissions: z.object({ title: optionalText, subheading1: optionalText, subheading2: optionalText, description: optionalText, checklist: z.object({ note: optionalText, texts: z.array(z.object({ lists: optionalText }).passthrough()).max(100).default([]) }).passthrough().default({ note: "", texts: [] }) }).passthrough().default({ title: "", subheading1: "", subheading2: "", description: "", checklist: { note: "", texts: [] } }),
  visa_requirements: z.object({ title: optionalText, subheading: optionalText, details: z.array(z.object({ lists: optionalText }).passthrough()).max(100).default([]) }).passthrough().default({ title: "", subheading: "", details: [] }),
  topUniversities: z.array(z.object({ name: optionalText, logo: imageSchema, website: optionalText }).passthrough()).max(100).default([]),
  popularCourses: z.object({ title: optionalText, items: z.array(z.object({ title: optionalText, count: optionalText }).passthrough()).max(100).default([]) }).passthrough().default({ title: "", items: [] }),
  jobsAndOpportunities: z.object({ title: optionalText, categories: z.array(z.object({ title: optionalText, points: z.array(z.string().max(1000)).max(40).default([]) }).passthrough()).max(50).default([]) }).passthrough().default({ title: "", categories: [] }),
  students_expriences: z.object({ title: optionalText, subheading: optionalText, images: z.array(z.object({ url: z.string().max(1000).optional().default(""), alternativeText: z.string().max(500).optional().default("") }).passthrough()).max(100).default([]) }).passthrough().default({ title: "", subheading: "", images: [] }),
  videos: z.array(z.object({ title: optionalText, url: z.string().trim().min(1).max(2000), thumbnail: imageSchema }).passthrough()).max(100).default([]),
}).passthrough();

export const destinationInputSchema = z.object({ country: z.enum(["UK", "USA", "Canada", "Ireland", "France"]), slug, title: z.string().trim().min(1).max(200), status: statusSchema, content: destinationContentSchema, seo: z.object({ title: z.string().max(200).optional().default(""), description: z.string().max(500).optional().default(""), canonicalUrl: z.string().url().or(z.literal("")).optional().default(""), keywords: z.array(z.string().max(80)).max(30).default([]), ogImage: z.string().max(1000).optional().default("") }).optional() });

export const universityContentSchema = z.object({
  overview: optionalText,
  stats: z.object({ acceptanceRate: optionalText, Total_International_Students: optionalText, ratio: optionalText, placement: optionalText }).passthrough().nullish(),
  rankings: z.object({ description: optionalText, items: z.array(z.object({ title: optionalText, description: optionalText }).passthrough()).max(100).nullish().transform(value => value ?? []).default([]) }).passthrough().nullish(),
  intakes: z.object({ description: optionalText, famous_intakes: z.array(z.object({ title: optionalText, description: optionalText }).passthrough()).max(50).nullish().transform(value => value ?? []).default([]) }).passthrough().nullish(),
  cost_of_study: z.object({ description: optionalText, expenses_table: z.array(z.object({ types_of_expenses: optionalText, annual_expenses: optionalText }).passthrough()).max(100).nullish().transform(value => value ?? []).default([]) }).passthrough().nullish(),
  scholarship: z.object({ description: optionalText, scholarship_details: z.array(z.object({ title: optionalText, amount: optionalText, type: optionalText, level: optionalText }).passthrough()).max(100).nullish().transform(value => value ?? []).default([]) }).passthrough().nullish(),
  admissions: z.object({ description: optionalText, admissions_req: z.array(z.object({ title: optionalText, requirement_items: z.array(z.object({ requirement_item: optionalText }).passthrough()).max(50).nullish().transform(value => value ?? []).default([]) }).passthrough()).max(50).nullish().transform(value => value ?? []).default([]) }).passthrough().nullish(),
  placements: z.object({ description: optionalText, jobs: z.array(z.object({ job_profiles: optionalText, average_salary: optionalText }).passthrough()).max(100).nullish().transform(value => value ?? []).default([]), top_recruiters_imgs: z.array(imageSchema).max(100).nullish().transform(value => value ?? []).default([]) }).passthrough().nullish(),
  faqs: z.object({ accordion: z.array(z.object({ question: optionalText, answer: optionalText }).passthrough()).max(100).nullish().transform(value => value ?? []).default([]) }).passthrough().nullish(),
}).passthrough();

export const universityInputSchema = z.object({ country: z.enum(["UK", "USA", "Canada", "Ireland", "France"]), slug, name: z.string().trim().min(1).max(200), campus: z.string().max(200).optional().default(""), website: z.string().max(500).optional().default(""), logo: imageSchema, banner: imageSchema, content: universityContentSchema, status: statusSchema });

export const courseInputSchema = z.object({ universityId: z.string().min(1), name: z.string().trim().min(1).max(200), degreeLevel: z.string().max(100).optional().default(""), duration: z.string().max(120).optional().default(""), annualFee: z.string().max(120).optional().default(""), currency: z.string().max(10).optional().default(""), intakes: z.array(z.string().max(80)).max(20).default([]), eligibility: z.string().max(5000).optional().default(""), description: z.string().max(10000).optional().default(""), status: statusSchema.default("DRAFT"), order: z.number().int().min(0).default(0) });
export const coursePatchSchema = courseInputSchema.partial();

export const galleryInputSchema = z.object({ slug, title: z.string().trim().min(1).max(200), description: z.string().max(5000).optional().default(""), category: z.string().max(100).optional().default(""), media: z.array(z.object({ id: z.string().min(1), altText: z.string().max(500).optional().default("") })).max(50).default([]), status: statusSchema.default("DRAFT"), order: z.number().int().min(0).default(0) }).superRefine((data, ctx) => { if (data.status === "PUBLISHED" && !data.media.length) ctx.addIssue({ code: "custom", path: ["media"], message: "Published gallery items need at least one image." }); });

export const officeGalleryInputSchema = z.object({
  branch: z.enum(officeBranchValues),
  area: z.enum(officeAreaValues),
  media: z.array(z.object({
    id: z.string().min(1),
    altText: z.string().max(500).optional().default(""),
  })).max(50),
  status: statusSchema.default("DRAFT"),
}).superRefine((data, ctx) => {
  if (data.status === "PUBLISHED" && !data.media.length) {
    ctx.addIssue({
      code: "custom",
      path: ["media"],
      message: "Published office areas need at least one image.",
    });
  }
});

export const userCreateSchema = z.object({ name: z.string().trim().min(1).max(120), email: z.string().email().max(254), password: z.string().min(12).max(128).refine(value => new TextEncoder().encode(value).length <= 72), role: z.enum(["ADMIN", "EDITOR"]) });

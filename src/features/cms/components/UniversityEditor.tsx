// Vsource-frontend\src\features\cms\components\UniversityEditor.tsx
"use client";

import { ContentRecord, MediaAsset } from "../types";

import { MediaPicker, RichTextEditor, SelectField, TextField } from "./Fields";

import { Repeater } from "./Repeater";

export type UniversityForm = {
  id: string;
  name: string;
  country: string;
  campus: string;
  website: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  logo: any;
  banner: any;
  content: ContentRecord;
  gallery: MediaAsset[];
};

export const blankUniversity = (): UniversityForm => ({
  id: "",
  name: "",
  country: "UK",
  campus: "",
  website: "",
  slug: "",
  status: "DRAFT",
  logo: null,
  banner: null,
  content: {
    overview: "",
    stats: {
      acceptanceRate: "",
      Total_International_Students: "",
      ratio: "",
      placement: "",
    },
    rankings: {
      description: "",
      items: [],
    },
    intakes: {
      description: "",
      famous_intakes: [],
    },
    cost_of_study: {
      description: "",
      expenses_table: [],
    },
    scholarship: {
      description: "",
      scholarship_details: [],
    },
    admissions: {
      description: "",
      admissions_req: [],
    },
    placements: {
      description: "",
      jobs: [],
      top_recruiters_imgs: [],
    },
    faqs: {
      accordion: [],
    },
  },
  gallery: [],
});

/* ================= HELPERS ================= */

const toAssets = (v: any): MediaAsset[] =>
  v?.url
    ? [
        {
          id: v.id || v.url,
          url: v.url,
          name: v.name || v.url,
          mimeType: v.mimeType || "image/webp",
          altText: v.alternativeText || "",
        },
      ]
    : [];

const requirementText = (value: unknown): string =>
  Array.isArray(value)
    ? value
        .map((item) =>
          typeof item === "string"
            ? item
            : item && typeof item === "object"
              ? String((item as Record<string, unknown>).requirement_item ?? "")
              : "",
        )
        .filter(Boolean)
        .join("\n")
    : typeof value === "string"
      ? value
      : "";

const requirementItems = (value: unknown): { requirement_item: string }[] =>
  requirementText(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((requirement_item) => ({ requirement_item }));

/* ================= RECORD MAPPER ================= */

export function universityFromRecord(item: ContentRecord): UniversityForm {
  const blank = blankUniversity();

  const source =
    item.content && typeof item.content === "object" ? item.content : {};

  const admissions = {
    ...blank.content.admissions,
    ...(source.admissions || {}),
  };

  const admissionsReq = Array.isArray(admissions.admissions_req)
    ? admissions.admissions_req
    : [];

  const rankings = {
    ...blank.content.rankings,
    ...(source.rankings || {}),
  };

  const intakes = {
    ...blank.content.intakes,
    ...(source.intakes || {}),
  };

  const costs = {
    ...blank.content.cost_of_study,
    ...(source.cost_of_study || {}),
  };

  const scholarships = {
    ...blank.content.scholarship,
    ...(source.scholarship || {}),
  };

  const placements = {
    ...blank.content.placements,
    ...(source.placements || {}),
  };

  const faqs = {
    ...blank.content.faqs,
    ...(source.faqs || {}),
  };

  return {
    ...blank,

    id: String(item.id || ""),
    name: typeof item.name === "string" ? item.name : "",
    country: item.country?.name || "UK",
    campus: typeof item.campus === "string" ? item.campus : "",
    website: typeof item.website === "string" ? item.website : "",
    slug: typeof item.slug === "string" ? item.slug : "",
    status: item.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",

    logo: item.logo || null,
    banner: item.banner || null,

    content: {
      ...blank.content,
      ...source,

      stats: {
        ...blank.content.stats,
        ...(source.stats || {}),
      },

      rankings: {
        ...rankings,
        items: Array.isArray(rankings.items) ? rankings.items : [],
      },

      intakes: {
        ...intakes,
        famous_intakes: Array.isArray(intakes.famous_intakes)
          ? intakes.famous_intakes
          : [],
      },

      cost_of_study: {
        ...costs,
        expenses_table: Array.isArray(costs.expenses_table)
          ? costs.expenses_table
          : [],
      },

      scholarship: {
        ...scholarships,
        scholarship_details: Array.isArray(scholarships.scholarship_details)
          ? scholarships.scholarship_details
          : [],
      },

      admissions: {
        ...admissions,
        admissions_req: admissionsReq.map((row: any) => ({
          ...row,
          requirement_items: requirementText(row?.requirement_items),
        })),
      },

      placements: {
        ...placements,
        jobs: Array.isArray(placements.jobs) ? placements.jobs : [],
        top_recruiters_imgs: Array.isArray(placements.top_recruiters_imgs)
          ? placements.top_recruiters_imgs
          : [],
      },

      faqs: {
        ...faqs,
        accordion: Array.isArray(faqs.accordion) ? faqs.accordion : [],
      },
    },

    gallery: (Array.isArray(item.gallery) ? item.gallery : [])
      .map((g: any) => ({
        id: g.mediaId || g.media?.id || g.id,
        url: g.url || g.media?.url || "",
        thumbnailPath: g.media?.thumbnailPath,
        name: g.media?.name || g.url || "",
        mimeType: g.media?.mimeType || "image/webp",
        altText: g.altText || "",
      }))
      .filter((g: MediaAsset) => g.url),
  };
}

/* ================= EDITOR COMPONENT ================= */

export default function UniversityEditor({
  value,
  onChange,
}: {
  value: UniversityForm;
  onChange: (next: UniversityForm) => void;
}) {
  const set = (key: keyof UniversityForm, v: any) =>
    onChange({
      ...value,
      [key]: v,
    });

  const content = value.content;

  const patchContent = (key: string, v: any) =>
    set("content", {
      ...content,
      [key]: v,
    });

  const logo = toAssets(value.logo);
  const banner = toAssets(value.banner);

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      {/* ==========================================
          UNIVERSITY DETAILS
      ========================================== */}

      <section className="grid min-w-0 grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:gap-6 sm:p-5 lg:grid-cols-2 lg:p-6">
        <h3 className="text-lg font-bold tracking-tight text-slate-900 lg:col-span-2">
          University details
        </h3>

        <TextField
          label="University name"
          required
          value={value.name}
          onChange={(v) => set("name", v)}
        />

        <SelectField
          label="Country"
          value={value.country}
          onChange={(v) => set("country", v)}
          options={["UK", "USA", "Canada", "Ireland", "France"].map((x) => ({
            value: x,
            label: x,
          }))}
        />

        <TextField
          label="Location / campus"
          value={value.campus}
          onChange={(v) => set("campus", v)}
        />

        <TextField
          label="URL slug"
          required
          value={value.slug}
          onChange={(v) => set("slug", v)}
        />

        <TextField
          label="Official website"
          value={value.website}
          onChange={(v) => set("website", v)}
        />

        <SelectField
          label="Publication"
          value={value.status}
          onChange={(v) => set("status", v as any)}
          options={[
            { value: "DRAFT", label: "Draft" },
            { value: "PUBLISHED", label: "Published" },
          ]}
        />

        <div className="min-w-0">
          <MediaPicker
            label="University logo"
            folder="universities"
            value={logo}
            onChange={(a) =>
              set(
                "logo",
                a[0]
                  ? {
                      url: a[0].url,
                      alternativeText: a[0].altText || "",
                    }
                  : null,
              )
            }
          />
        </div>

        <div className="min-w-0">
          <MediaPicker
            label="University banner"
            folder="banners"
            value={banner}
            onChange={(a) =>
              set(
                "banner",
                a[0]
                  ? {
                      url: a[0].url,
                      alternativeText: a[0].altText || "",
                    }
                  : null,
              )
            }
          />
        </div>

        {/* Full-width Overview Editor */}
        <div className="col-span-1 w-full min-w-0 lg:col-span-2 [&>*]:w-full [&_*]:max-w-none">
          <RichTextEditor
            label="About / overview"
            value={content.overview || ""}
            onChange={(v) => patchContent("overview", v)}
          />
        </div>
      </section>

      {/* ==========================================
          OVERVIEW FACTS AND RANKINGS
      ========================================== */}

      <details
        open
        className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6"
      >
        <summary className="cursor-pointer select-none text-sm font-bold tracking-tight text-slate-900 marker:text-[#C71920] sm:text-base">
          Overview facts and rankings
        </summary>

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
          {[
            ["acceptanceRate", "Acceptance rate"],
            ["Total_International_Students", "International students"],
            ["ratio", "Student ratio"],
            ["placement", "Placement rate"],
          ].map(([k, l]) => (
            <div key={k} className="min-w-0">
              <TextField
                label={l}
                value={content.stats?.[k] || ""}
                onChange={(v) =>
                  patchContent("stats", {
                    ...content.stats,
                    [k]: v,
                  })
                }
              />
            </div>
          ))}

          {/* Full-width Rankings */}
          <div className="col-span-1 min-w-0 md:col-span-2">
            <Repeater
              label="Rankings"
              rows={content.rankings?.items || []}
              fields={[
                { key: "title", label: "Ranking" },
                {
                  key: "description",
                  label: "Position / detail",
                },
              ]}
              createRow={() => ({
                title: "",
                description: "",
              })}
              onChange={(rows) =>
                patchContent("rankings", {
                  ...content.rankings,
                  items: rows,
                })
              }
            />
          </div>

          {/* Full-width Intakes */}
          <div className="col-span-1 min-w-0 md:col-span-2">
            <Repeater
              label="Intakes"
              rows={content.intakes?.famous_intakes || []}
              fields={[
                { key: "title", label: "Intake" },
                {
                  key: "description",
                  label: "Description",
                  kind: "multiline",
                },
              ]}
              createRow={() => ({
                title: "",
                description: "",
              })}
              onChange={(rows) =>
                patchContent("intakes", {
                  ...content.intakes,
                  famous_intakes: rows,
                })
              }
            />
          </div>
        </div>
      </details>

      {/* ==========================================
          FEES, SCHOLARSHIPS AND ADMISSIONS
      ========================================== */}

      <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
        <summary className="cursor-pointer select-none text-sm font-bold tracking-tight text-slate-900 marker:text-[#C71920] sm:text-base">
          Fees, scholarships and admissions
        </summary>

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-6 sm:gap-7">
          {/* Study Costs */}
          <div className="w-full min-w-0 [&>*]:w-full [&_*]:max-w-none">
            <RichTextEditor
              label="Study costs introduction"
              value={content.cost_of_study?.description || ""}
              onChange={(v) =>
                patchContent("cost_of_study", {
                  ...content.cost_of_study,
                  description: v,
                })
              }
            />
          </div>

          <div className="w-full min-w-0">
            <Repeater
              label="Annual expenses"
              rows={content.cost_of_study?.expenses_table || []}
              fields={[
                {
                  key: "types_of_expenses",
                  label: "Expense",
                },
                {
                  key: "annual_expenses",
                  label: "Annual amount",
                },
              ]}
              createRow={() => ({
                types_of_expenses: "",
                annual_expenses: "",
              })}
              onChange={(rows) =>
                patchContent("cost_of_study", {
                  ...content.cost_of_study,
                  expenses_table: rows,
                })
              }
            />
          </div>

          {/* Scholarships */}
          <div className="w-full min-w-0 [&>*]:w-full [&_*]:max-w-none">
            <RichTextEditor
              label="Scholarships introduction"
              value={content.scholarship?.description || ""}
              onChange={(v) =>
                patchContent("scholarship", {
                  ...content.scholarship,
                  description: v,
                })
              }
            />
          </div>

          <div className="w-full min-w-0">
            <Repeater
              label="Scholarships"
              rows={content.scholarship?.scholarship_details || []}
              fields={[
                {
                  key: "title",
                  label: "Scholarship",
                },
                {
                  key: "amount",
                  label: "Amount",
                },
                {
                  key: "type",
                  label: "Type",
                },
                {
                  key: "level",
                  label: "Level",
                },
              ]}
              createRow={() => ({
                title: "",
                amount: "",
                type: "",
                level: "",
              })}
              onChange={(rows) =>
                patchContent("scholarship", {
                  ...content.scholarship,
                  scholarship_details: rows,
                })
              }
            />
          </div>

          {/* Admission Information */}
          <div className="w-full min-w-0 [&>*]:w-full [&_*]:max-w-none">
            <RichTextEditor
              label="Admission information"
              value={content.admissions?.description || ""}
              onChange={(v) =>
                patchContent("admissions", {
                  ...content.admissions,
                  description: v,
                })
              }
            />
          </div>

          <div className="w-full min-w-0">
            <Repeater
              label="Admission requirements"
              rows={content.admissions?.admissions_req || []}
              fields={[
                {
                  key: "title",
                  label: "Requirement group",
                },
                {
                  key: "requirement_items",
                  label: "Requirements (one per line)",
                  kind: "multiline",
                },
              ]}
              createRow={() => ({
                title: "",
                requirement_items: "",
              })}
              onChange={(rows) =>
                patchContent("admissions", {
                  ...content.admissions,
                  admissions_req: rows.map((row) => ({
                    ...row,
                    requirement_items: requirementItems(row.requirement_items),
                  })),
                })
              }
            />
          </div>
        </div>
      </details>

      {/* ==========================================
          PLACEMENTS, FAQS AND CAMPUS GALLERY
      ========================================== */}

      <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
        <summary className="cursor-pointer select-none text-sm font-bold tracking-tight text-slate-900 marker:text-[#C71920] sm:text-base">
          Placements, FAQs and campus gallery
        </summary>

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-6 sm:gap-7">
          {/* Placement Information */}
          <div className="w-full min-w-0 [&>*]:w-full [&_*]:max-w-none">
            <RichTextEditor
              label="Placements information"
              value={content.placements?.description || ""}
              onChange={(v) =>
                patchContent("placements", {
                  ...content.placements,
                  description: v,
                })
              }
            />
          </div>

          {/* Job Outcomes */}
          <div className="w-full min-w-0">
            <Repeater
              label="Job outcomes"
              rows={content.placements?.jobs || []}
              fields={[
                {
                  key: "job_profiles",
                  label: "Job profile",
                },
                {
                  key: "average_salary",
                  label: "Average salary",
                },
              ]}
              createRow={() => ({
                job_profiles: "",
                average_salary: "",
              })}
              onChange={(rows) =>
                patchContent("placements", {
                  ...content.placements,
                  jobs: rows,
                })
              }
            />
          </div>

          {/* FAQs */}
          <div className="w-full min-w-0">
            <Repeater
              label="Frequently asked questions"
              rows={content.faqs?.accordion || []}
              fields={[
                {
                  key: "question",
                  label: "Question",
                },
                {
                  key: "answer",
                  label: "Answer",
                  kind: "multiline",
                },
              ]}
              createRow={() => ({
                question: "",
                answer: "",
              })}
              onChange={(rows) =>
                patchContent("faqs", {
                  accordion: rows,
                })
              }
            />
          </div>

          {/* Campus Gallery */}
          <div className="w-full min-w-0">
            <MediaPicker
              label="Campus images"
              folder="universities"
              multiple
              value={value.gallery}
              onChange={(a) => set("gallery", a)}
            />
          </div>
        </div>
      </details>
    </div>
  );
}

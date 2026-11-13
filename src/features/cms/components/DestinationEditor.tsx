// src\features\cms\components\DestinationEditor.tsx
"use client";

import { ContentRecord, MediaAsset } from "../types";
import {
  MediaPicker,
  RichTextEditor,
  SelectField,
  TextAreaField,
  TextField,
} from "./Fields";
import { Repeater } from "./Repeater";

export type DestinationForm = {
  id: string;
  country: string;
  slug: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  content: ContentRecord;
  seo: {
    title: string;
    description: string;
    canonicalUrl: string;
    keywords: string;
    ogImage: string;
  };
};
export const emptyDestination = (): DestinationForm => ({
  id: "",
  country: "UK",
  slug: "",
  title: "",
  status: "DRAFT",
  content: {
    quickLinks: [],
    overview: { title: "", description: "", highlights: [] },
    whyStudyin: {
      title: "",
      description: "",
      highlights_points: [],
      whyStudyin_cards: [],
    },
    Living_Cost_Tuition_Fee: { title: "", cities: [] },
    admissions: {
      title: "",
      subheading1: "",
      subheading2: "",
      description: "",
      checklist: { note: "", texts: [] },
    },
    visa_requirements: { title: "", subheading: "", details: [] },
    topUniversities: [],
    popularCourses: { title: "", items: [] },
    jobsAndOpportunities: { title: "", categories: [] },
    students_expriences: { title: "", subheading: "", images: [] },
    videos: [],
  },
  seo: {
    title: "",
    description: "",
    canonicalUrl: "",
    keywords: "",
    ogImage: "",
  },
});
export function destinationFromRecord(item: ContentRecord): DestinationForm {
  const empty = emptyDestination();
  const content = item.content || {};
  return {
    ...empty,
    id: item.id,
    country: item.country?.name || "UK",
    slug: item.slug || "",
    title: item.title || "",
    status: item.status || "DRAFT",
    content: {
      ...empty.content,
      ...content,
      banner: content.banner || { url: "", alternativeText: "" },
      overview: { ...empty.content.overview, ...content.overview },
      whyStudyin: { ...empty.content.whyStudyin, ...content.whyStudyin },
      Living_Cost_Tuition_Fee: {
        ...empty.content.Living_Cost_Tuition_Fee,
        ...content.Living_Cost_Tuition_Fee,
      },
      admissions: {
        ...empty.content.admissions,
        ...content.admissions,
        checklist: {
          ...empty.content.admissions.checklist,
          ...content.admissions?.checklist,
        },
      },
      visa_requirements: {
        ...empty.content.visa_requirements,
        ...content.visa_requirements,
      },
      popularCourses: {
        ...empty.content.popularCourses,
        ...content.popularCourses,
      },
      jobsAndOpportunities: {
        ...empty.content.jobsAndOpportunities,
        ...content.jobsAndOpportunities,
      },
      students_expriences: {
        ...empty.content.students_expriences,
        ...content.students_expriences,
      },
    },
    seo: {
      title: item.seo?.title || "",
      description: item.seo?.description || "",
      canonicalUrl: item.seo?.canonicalUrl || "",
      keywords: (item.seo?.keywords || []).join(", "),
      ogImage: item.seo?.ogImage || "",
    },
  };
}
function asset(value: any): MediaAsset[] {
  const path = typeof value === "string" ? value : value?.url;
  if (!path) return [];
  const video = /\.(mp4|webm|mov)(?:$|\?)/i.test(path);
  return [
    {
      id: value?.id || path,
      url: path,
      mimeType: value?.mimeType || (video ? "video/mp4" : "image/webp"),
      name: value?.name || path,
      altText: value?.alternativeText || "",
    },
  ];
}
function StringList({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <div className="grid min-w-0 gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:p-4 md:col-span-2">
      <div className="flex justify-between">
        <strong className="text-sm">{label}</strong>
        <button
          type="button"
          onClick={() => onChange([...values, ""])}
          className="text-xs text-blue-700"
        >
          Add item
        </button>
      </div>
      {values.map((value, index) => (
        <div key={index} className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded border px-3 py-2 text-sm"
            value={value}
            onChange={(e) =>
              onChange(
                values.map((item, i) => (i === index ? e.target.value : item)),
              )
            }
          />
          <button
            type="button"
            className="text-red-700"
            onClick={() => onChange(values.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

export default function DestinationEditor({
  value,
  onChange,
}: {
  value: DestinationForm;
  onChange: (value: DestinationForm) => void;
}) {
  const c = value.content;
  const set = (key: keyof DestinationForm, val: any) =>
    onChange({ ...value, [key]: val });
  const setContent = (key: string, val: any) =>
    set("content", { ...c, [key]: val });
  const banner = asset(c.banner);
  const cities = c.Living_Cost_Tuition_Fee?.cities || [];
  function setCities(next: ContentRecord[]) {
    setContent("Living_Cost_Tuition_Fee", {
      ...c.Living_Cost_Tuition_Fee,
      cities: next,
    });
  }
  return (
    <div className="grid min-w-0 gap-5 sm:gap-6 [&>*]:min-w-0">
      <section className="grid min-w-0 grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:gap-6 sm:p-5 lg:grid-cols-2 lg:p-6">
        <h3 className="text-lg font-bold tracking-tight text-slate-900 lg:col-span-2">
          Page details
        </h3>
        <SelectField
          label="Country"
          value={value.country}
          onChange={(country) => set("country", country)}
          options={["UK", "USA", "Canada", "Ireland", "France"].map((x) => ({
            value: x,
            label: x,
          }))}
        />
        <SelectField
          label="Publication"
          value={value.status}
          onChange={(status) => set("status", status)}
          options={[
            { value: "DRAFT", label: "Draft" },
            { value: "PUBLISHED", label: "Published" },
          ]}
        />
        <TextField
          label="Page title"
          value={value.title}
          onChange={(title) => set("title", title)}
          required
        />
        <TextField
          label="URL slug"
          value={value.slug}
          onChange={(slug) => set("slug", slug)}
          required
          hint="Lowercase words separated by hyphens."
        />
        <div className="md:col-span-2">
          <MediaPicker
            label="Hero banner"
            folder="banners"
            value={banner}
            onChange={(items) =>
              setContent(
                "banner",
                items[0]
                  ? {
                      url: items[0].url,
                      alternativeText: items[0].altText || "",
                    }
                  : null,
              )
            }
          />
        </div>
      </section>
      <details
        open
        className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors sm:p-5 lg:p-6"
      >
        <summary className="cursor-pointer select-none text-sm font-bold tracking-tight text-slate-900 marker:text-[#C71920] sm:text-base">
          Quick Links
        </summary>
        <div className="mt-5 min-w-0">
          <Repeater
            label="Links"
            rows={c.quickLinks || []}
            fields={[
              { key: "title", label: "Link label", required: true },
              { key: "href", label: "Section anchor or path", required: true },
            ]}
            createRow={() => ({ title: "", href: "#overview" })}
            onChange={(rows) => setContent("quickLinks", rows)}
            max={20}
          />
        </div>
      </details>
      <details
        open
        className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors sm:p-5 lg:p-6"
      >
        <summary className="cursor-pointer select-none text-sm font-bold tracking-tight text-slate-900 marker:text-[#C71920] sm:text-base">
          Overview & Highlights
        </summary>
        <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2 [&>*]:min-w-0 [&>*]:w-full">
          <div className="min-w-0 w-full">
            <TextField
              label="Overview heading"
              value={c.overview?.title}
              onChange={(v) =>
                setContent("overview", { ...c.overview, title: v })
              }
            />
          </div>
          <div className="min-w-0 w-full">
            <RichTextEditor
              label="Overview description"
              value={c.overview?.description}
              onChange={(v) =>
                setContent("overview", { ...c.overview, description: v })
              }
            />
          </div>
          <div className="min-w-0 w-full lg:col-span-2">
            <Repeater
              label="Highlights"
              rows={c.overview?.highlights || []}
              fields={[
                { key: "label", label: "Label" },
                { key: "value", label: "Value" },
              ]}
              createRow={() => ({ label: "", value: "" })}
              onChange={(rows) =>
                setContent("overview", { ...c.overview, highlights: rows })
              }
            />
          </div>
        </div>
      </details>
      <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors sm:p-5 lg:p-6">
        <summary className="cursor-pointer select-none text-sm font-bold tracking-tight text-slate-900 marker:text-[#C71920] sm:text-base">
          Why Study
        </summary>
        <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2 [&>*]:min-w-0 [&>*]:w-full">
          <div className="min-w-0 w-full">
            <TextField
              label="Section heading"
              value={c.whyStudyin?.title}
              onChange={(v) =>
                setContent("whyStudyin", { ...c.whyStudyin, title: v })
              }
            />
          </div>
          <div className="min-w-0 w-full">
            <RichTextEditor
              label="Description"
              value={c.whyStudyin?.description}
              onChange={(v) =>
                setContent("whyStudyin", { ...c.whyStudyin, description: v })
              }
            />
          </div>
          <div className="min-w-0 w-full lg:col-span-2">
            <Repeater
              label="Reasons and benefits"
              rows={c.whyStudyin?.whyStudyin_cards || []}
              fields={[
                { key: "title", label: "Title" },
                { key: "description", label: "Description", kind: "multiline" },
              ]}
              createRow={() => ({ title: "", description: "" })}
              onChange={(rows) =>
                setContent("whyStudyin", {
                  ...c.whyStudyin,
                  whyStudyin_cards: rows,
                })
              }
            />
          </div>
          <div className="min-w-0 w-full lg:col-span-2">
            <Repeater
              label="Highlight points"
              rows={c.whyStudyin?.highlights_points || []}
              fields={[
                { key: "description", label: "Point", kind: "multiline" },
              ]}
              createRow={() => ({ description: "" })}
              onChange={(rows) =>
                setContent("whyStudyin", {
                  ...c.whyStudyin,
                  highlights_points: rows,
                })
              }
            />
          </div>
        </div>
      </details>
      <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors sm:p-5 lg:p-6">
        <summary className="cursor-pointer select-none text-sm font-bold tracking-tight text-slate-900 marker:text-[#C71920] sm:text-base">
          Living Costs, Tuition Fees & City-wise Costs
        </summary>
        <div className="mt-5 grid min-w-0 grid-cols-1 gap-5">
          <TextField
            label="Section heading"
            value={c.Living_Cost_Tuition_Fee?.title}
            onChange={(v) =>
              setContent("Living_Cost_Tuition_Fee", {
                ...c.Living_Cost_Tuition_Fee,
                title: v,
              })
            }
          />
          {cities.map((city: ContentRecord, cityIndex: number) => (
            <article
              key={city.id || cityIndex}
              className="grid min-w-0 grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 md:grid-cols-2"
            >
              <div className="flex items-center justify-between md:col-span-2">
                <h4 className="font-semibold">City {cityIndex + 1}</h4>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="text-sm"
                    disabled={cityIndex === 0}
                    onClick={() =>
                      setCities(
                        cities.map((x: ContentRecord, i: number) =>
                          i === cityIndex
                            ? cities[i - 1]
                            : i === cityIndex - 1
                              ? cities[i]
                              : x,
                        ),
                      )
                    }
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="text-sm"
                    disabled={cityIndex === cities.length - 1}
                    onClick={() =>
                      setCities(
                        cities.map((x: ContentRecord, i: number) =>
                          i === cityIndex
                            ? cities[i + 1]
                            : i === cityIndex + 1
                              ? cities[i]
                              : x,
                        ),
                      )
                    }
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="text-sm text-red-700"
                    onClick={() =>
                      setCities(
                        cities.filter((_: any, i: number) => i !== cityIndex),
                      )
                    }
                  >
                    Remove city
                  </button>
                </div>
              </div>
              <TextField
                label="City name"
                value={city.city}
                onChange={(v) =>
                  setCities(
                    cities.map((x: ContentRecord, i: number) =>
                      i === cityIndex ? { ...x, city: v } : x,
                    ),
                  )
                }
              />
              <div className="md:col-span-2">
                <TextAreaField
                  label="City description"
                  value={city.description}
                  onChange={(v) =>
                    setCities(
                      cities.map((x: ContentRecord, i: number) =>
                        i === cityIndex ? { ...x, description: v } : x,
                      ),
                    )
                  }
                />
              </div>
              <div className="md:col-span-2">
                <MediaPicker
                  label="City image"
                  folder="destinations"
                  value={asset(city.image)}
                  onChange={(items) =>
                    setCities(
                      cities.map((x: ContentRecord, i: number) =>
                        i === cityIndex
                          ? {
                              ...x,
                              image: items[0]
                                ? {
                                    url: items[0].url,
                                    alternativeText: items[0].altText || "",
                                  }
                                : null,
                            }
                          : x,
                      ),
                    )
                  }
                />
              </div>
              {(city.tables || []).map(
                (table: ContentRecord, tableIndex: number) => (
                  <div
                    key={tableIndex}
                    className="grid min-w-0 gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4 md:col-span-2"
                  >
                    <div className="flex gap-2">
                      <TextField
                        label="Cost table title"
                        value={table.title}
                        onChange={(v) =>
                          setCities(
                            cities.map((x: ContentRecord, i: number) =>
                              i === cityIndex
                                ? {
                                    ...x,
                                    tables: x.tables.map(
                                      (t: ContentRecord, j: number) =>
                                        j === tableIndex
                                          ? { ...t, title: v }
                                          : t,
                                    ),
                                  }
                                : x,
                            ),
                          )
                        }
                      />
                      <button
                        type="button"
                        className="self-end text-sm text-red-700"
                        onClick={() =>
                          setCities(
                            cities.map((x: ContentRecord, i: number) =>
                              i === cityIndex
                                ? {
                                    ...x,
                                    tables: x.tables.filter(
                                      (_: any, j: number) => j !== tableIndex,
                                    ),
                                  }
                                : x,
                            ),
                          )
                        }
                      >
                        Remove table
                      </button>
                    </div>
                    <Repeater
                      label="Cost items"
                      rows={table.label_values || []}
                      fields={[
                        { key: "label", label: "Expense label" },
                        { key: "value", label: "Cost" },
                      ]}
                      createRow={() => ({ label: "", value: "" })}
                      onChange={(rows) =>
                        setCities(
                          cities.map((x: ContentRecord, i: number) =>
                            i === cityIndex
                              ? {
                                  ...x,
                                  tables: x.tables.map(
                                    (t: ContentRecord, j: number) =>
                                      j === tableIndex
                                        ? { ...t, label_values: rows }
                                        : t,
                                  ),
                                }
                              : x,
                          ),
                        )
                      }
                    />
                  </div>
                ),
              )}
              <button
                type="button"
                className="rounded border bg-white px-3 py-2 text-sm md:col-span-2"
                onClick={() =>
                  setCities(
                    cities.map((x: ContentRecord, i: number) =>
                      i === cityIndex
                        ? {
                            ...x,
                            tables: [
                              ...(x.tables || []),
                              { title: "", label_values: [] },
                            ],
                          }
                        : x,
                    ),
                  )
                }
              >
                Add cost table
              </button>
            </article>
          ))}
          <button
            type="button"
            className="w-fit rounded border px-3 py-2 text-sm"
            onClick={() =>
              setCities([
                ...cities,
                { city: "", description: "", image: null, tables: [] },
              ])
            }
          >
            Add city
          </button>
        </div>
      </details>
      <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors sm:p-5 lg:p-6">
        <summary className="cursor-pointer select-none text-sm font-bold tracking-tight text-slate-900 marker:text-[#C71920] sm:text-base">
          Admission Requirements
        </summary>
        <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2 [&>*]:min-w-0 [&>*]:w-full">
          <TextField
            label="Heading"
            value={c.admissions?.title}
            onChange={(v) =>
              setContent("admissions", { ...c.admissions, title: v })
            }
          />
          <TextField
            label="Subheading"
            value={c.admissions?.subheading1}
            onChange={(v) =>
              setContent("admissions", { ...c.admissions, subheading1: v })
            }
          />
          <TextField
            label="Secondary subheading"
            value={c.admissions?.subheading2}
            onChange={(v) =>
              setContent("admissions", { ...c.admissions, subheading2: v })
            }
          />
          <RichTextEditor
            label="Description"
            value={c.admissions?.description}
            onChange={(v) =>
              setContent("admissions", { ...c.admissions, description: v })
            }
          />
          <TextField
            label="Checklist note"
            value={c.admissions?.checklist?.note}
            onChange={(v) =>
              setContent("admissions", {
                ...c.admissions,
                checklist: { ...c.admissions.checklist, note: v },
              })
            }
          />
          <div className="min-w-0 w-full lg:col-span-2">
            <Repeater
              label="Requirements"
              rows={c.admissions?.checklist?.texts || []}
              fields={[{ key: "lists", label: "Requirement" }]}
              createRow={() => ({ lists: "" })}
              onChange={(rows) =>
                setContent("admissions", {
                  ...c.admissions,
                  checklist: { ...c.admissions.checklist, texts: rows },
                })
              }
            />
          </div>
        </div>
      </details>
      <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors sm:p-5 lg:p-6">
        <summary className="cursor-pointer select-none text-sm font-bold tracking-tight text-slate-900 marker:text-[#C71920] sm:text-base">
          Visa Requirements
        </summary>
        <div className="mt-5 grid min-w-0 grid-cols-1 gap-5">
          <TextField
            label="Heading"
            value={c.visa_requirements?.title}
            onChange={(v) =>
              setContent("visa_requirements", {
                ...c.visa_requirements,
                title: v,
              })
            }
          />
          <TextField
            label="Subheading"
            value={c.visa_requirements?.subheading}
            onChange={(v) =>
              setContent("visa_requirements", {
                ...c.visa_requirements,
                subheading: v,
              })
            }
          />
          <Repeater
            label="Visa details"
            rows={c.visa_requirements?.details || []}
            fields={[{ key: "lists", label: "Requirement" }]}
            createRow={() => ({ lists: "" })}
            onChange={(rows) =>
              setContent("visa_requirements", {
                ...c.visa_requirements,
                details: rows,
              })
            }
          />
        </div>
      </details>
      <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors sm:p-5 lg:p-6">
        <summary className="cursor-pointer select-none text-sm font-bold tracking-tight text-slate-900 marker:text-[#C71920] sm:text-base">
          Top Universities
        </summary>
        <div className="mt-5 min-w-0">
          <Repeater
            label="Universities"
            folder="universities"
            rows={c.topUniversities || []}
            fields={[
              { key: "name", label: "University name" },
              { key: "website", label: "Official website" },
              { key: "logo", label: "University logo", kind: "image" },
            ]}
            createRow={() => ({ name: "", website: "", logo: null })}
            onChange={(rows) => setContent("topUniversities", rows)}
          />
        </div>
      </details>
      <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors sm:p-5 lg:p-6">
        <summary className="cursor-pointer select-none text-sm font-bold tracking-tight text-slate-900 marker:text-[#C71920] sm:text-base">
          Popular Courses
        </summary>
        <div className="mt-5 grid min-w-0 grid-cols-1 gap-5">
          <TextField
            label="Section heading"
            value={c.popularCourses?.title}
            onChange={(v) =>
              setContent("popularCourses", { ...c.popularCourses, title: v })
            }
          />
          <Repeater
            label="Courses"
            rows={c.popularCourses?.items || []}
            fields={[
              { key: "title", label: "Course" },
              { key: "count", label: "Course count or short note" },
            ]}
            createRow={() => ({ title: "", count: "" })}
            onChange={(rows) =>
              setContent("popularCourses", { ...c.popularCourses, items: rows })
            }
          />
        </div>
      </details>
      <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors sm:p-5 lg:p-6">
        <summary className="cursor-pointer select-none text-sm font-bold tracking-tight text-slate-900 marker:text-[#C71920] sm:text-base">
          Jobs & Opportunities
        </summary>
        <div className="mt-5 grid min-w-0 grid-cols-1 gap-5">
          <TextField
            label="Section heading"
            value={c.jobsAndOpportunities?.title}
            onChange={(v) =>
              setContent("jobsAndOpportunities", {
                ...c.jobsAndOpportunities,
                title: v,
              })
            }
          />
          {(c.jobsAndOpportunities?.categories || []).map(
            (category: ContentRecord, i: number) => (
              <div
                key={i}
                className="grid min-w-0 grid-cols-1 gap-4 rounded-xl border border-slate-200 p-3 sm:p-4 md:grid-cols-2"
              >
                <div className="flex items-center justify-between md:col-span-2">
                  <strong>Opportunity category {i + 1}</strong>
                  <button
                    type="button"
                    onClick={() =>
                      setContent("jobsAndOpportunities", {
                        ...c.jobsAndOpportunities,
                        categories: c.jobsAndOpportunities.categories.filter(
                          (_: any, j: number) => i !== j,
                        ),
                      })
                    }
                    className="text-sm text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <TextField
                  label="Category"
                  value={category.title}
                  onChange={(v) =>
                    setContent("jobsAndOpportunities", {
                      ...c.jobsAndOpportunities,
                      categories: c.jobsAndOpportunities.categories.map(
                        (x: ContentRecord, j: number) =>
                          j === i ? { ...x, title: v } : x,
                      ),
                    })
                  }
                />
                <StringList
                  label="Job and opportunity points"
                  values={category.points || []}
                  onChange={(points) =>
                    setContent("jobsAndOpportunities", {
                      ...c.jobsAndOpportunities,
                      categories: c.jobsAndOpportunities.categories.map(
                        (x: ContentRecord, j: number) =>
                          j === i ? { ...x, points } : x,
                      ),
                    })
                  }
                />
              </div>
            ),
          )}
          <button
            type="button"
            onClick={() =>
              setContent("jobsAndOpportunities", {
                ...c.jobsAndOpportunities,
                categories: [
                  ...(c.jobsAndOpportunities?.categories || []),
                  { title: "", points: [] },
                ],
              })
            }
            className="w-fit rounded border px-3 py-2 text-sm"
          >
            Add category
          </button>
        </div>
      </details>
      <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors sm:p-5 lg:p-6">
        <summary className="cursor-pointer select-none text-sm font-bold tracking-tight text-slate-900 marker:text-[#C71920] sm:text-base">
          Student Experiences
        </summary>
        <div className="mt-5 grid min-w-0 grid-cols-1 gap-5">
          <TextField
            label="Heading"
            value={c.students_expriences?.title}
            onChange={(v) =>
              setContent("students_expriences", {
                ...c.students_expriences,
                title: v,
              })
            }
          />
          <TextField
            label="Subheading"
            value={c.students_expriences?.subheading}
            onChange={(v) =>
              setContent("students_expriences", {
                ...c.students_expriences,
                subheading: v,
              })
            }
          />
          <Repeater
            label="Student photos"
            folder="destinations"
            rows={c.students_expriences?.images || []}
            fields={[
              { key: "url", label: "Photo", kind: "image" },
              { key: "alternativeText", label: "Alt text" },
            ]}
            createRow={() => ({ url: "", alternativeText: "" })}
            onChange={(rows) =>
              setContent("students_expriences", {
                ...c.students_expriences,
                images: rows.map((row) => ({
                  url: row.url?.url || row.url,
                  alternativeText:
                    row.alternativeText || row.url?.alternativeText || "",
                })),
              })
            }
          />
        </div>
      </details>
      <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors sm:p-5 lg:p-6">
        <summary className="cursor-pointer select-none text-sm font-bold tracking-tight text-slate-900 marker:text-[#C71920] sm:text-base">
          Videos
        </summary>
        <div className="mt-5 grid min-w-0 gap-4">
          {(c.videos || []).map((video: ContentRecord, index: number) => (
            <div
              key={index}
              className="grid min-w-0 grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4 md:grid-cols-2"
            >
              <div className="flex items-center justify-between md:col-span-2">
                <strong>Video {index + 1}</strong>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded border px-2"
                    disabled={!index}
                    onClick={() =>
                      setContent(
                        "videos",
                        c.videos.map((x: ContentRecord, i: number) =>
                          i === index
                            ? c.videos[index - 1]
                            : i === index - 1
                              ? c.videos[index]
                              : x,
                        ),
                      )
                    }
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded border px-2"
                    disabled={index === c.videos.length - 1}
                    onClick={() =>
                      setContent(
                        "videos",
                        c.videos.map((x: ContentRecord, i: number) =>
                          i === index
                            ? c.videos[index + 1]
                            : i === index + 1
                              ? c.videos[index]
                              : x,
                        ),
                      )
                    }
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="text-sm text-red-700"
                    onClick={() =>
                      setContent(
                        "videos",
                        c.videos.filter((_: any, i: number) => i !== index),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
              <TextField
                label="Video title"
                value={video.title}
                onChange={(v) =>
                  setContent(
                    "videos",
                    c.videos.map((x: ContentRecord, i: number) =>
                      i === index ? { ...x, title: v } : x,
                    ),
                  )
                }
              />
              <TextField
                label="External video URL (optional)"
                value={video.url?.startsWith("http") ? video.url : ""}
                onChange={(v) =>
                  setContent(
                    "videos",
                    c.videos.map((x: ContentRecord, i: number) =>
                      i === index ? { ...x, url: v } : x,
                    ),
                  )
                }
              />
              <div className="md:col-span-2">
                <MediaPicker
                  label="Upload or replace video"
                  folder="destinations"
                  videos
                  value={asset(video.url)}
                  onChange={(items) =>
                    setContent(
                      "videos",
                      c.videos.map((x: ContentRecord, i: number) =>
                        i === index ? { ...x, url: items[0]?.url || "" } : x,
                      ),
                    )
                  }
                />
              </div>
              <div className="md:col-span-2">
                <MediaPicker
                  label="Video thumbnail"
                  folder="destinations"
                  value={asset(video.thumbnail)}
                  onChange={(items) =>
                    setContent(
                      "videos",
                      c.videos.map((x: ContentRecord, i: number) =>
                        i === index
                          ? {
                              ...x,
                              thumbnail: items[0]
                                ? {
                                    url: items[0].url,
                                    alternativeText: items[0].altText || "",
                                  }
                                : null,
                            }
                          : x,
                      ),
                    )
                  }
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="w-fit rounded border px-3 py-2 text-sm"
            onClick={() =>
              setContent("videos", [
                ...(c.videos || []),
                { title: "", url: "", thumbnail: null },
              ])
            }
          >
            Add video
          </button>
        </div>
      </details>
      <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors sm:p-5 lg:p-6">
        <summary className="cursor-pointer select-none text-sm font-bold tracking-tight text-slate-900 marker:text-[#C71920] sm:text-base">
          Search metadata
        </summary>
        <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 [&>*]:min-w-0">
          <TextField
            label="SEO title"
            value={value.seo.title}
            onChange={(v) => set("seo", { ...value.seo, title: v })}
          />
          <TextField
            label="Canonical URL"
            value={value.seo.canonicalUrl}
            onChange={(v) => set("seo", { ...value.seo, canonicalUrl: v })}
          />
          <TextAreaField
            label="Meta description"
            value={value.seo.description}
            onChange={(v) => set("seo", { ...value.seo, description: v })}
          />
          <TextField
            label="Keywords, separated by commas"
            value={value.seo.keywords}
            onChange={(v) => set("seo", { ...value.seo, keywords: v })}
          />
          <TextField
            label="Open Graph image path"
            value={value.seo.ogImage}
            onChange={(v) => set("seo", { ...value.seo, ogImage: v })}
          />
        </div>
      </details>
    </div>
  );
}

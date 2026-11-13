import type { StudyIn } from "@/types/StudyInPage";

type RecordValue = Record<string, unknown>;
export type NormalizedImage = { id?: string | number; url: string; alternativeText: string; name?: string };
const record = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const text = (value: unknown): string => typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : value == null || value === "" ? [] : [value];

export function normalizeDestinationImage(value: unknown): NormalizedImage | null {
  if (typeof value === "string") return value.trim() ? { url: value.trim(), alternativeText: "" } : null;
  const source = record(value);
  const attributes = record(source.attributes);
  const nestedData = record(source.data);
  const nestedAttributes = record(nestedData.attributes);
  const formats = record(attributes.formats ?? source.formats);
  const preferred = record(formats.large ?? formats.medium ?? formats.small ?? formats.thumbnail);
  const url = text(source.url ?? attributes.url ?? nestedAttributes.url ?? preferred.url ?? source.src).trim();
  if (!url) return null;
  return {
    ...(typeof source.id === "string" || typeof source.id === "number" ? { id: source.id } : {}),
    url,
    alternativeText: text(source.alternativeText ?? source.alt ?? attributes.alternativeText ?? nestedAttributes.alternativeText),
    ...(text(source.name ?? attributes.name ?? nestedAttributes.name) ? { name: text(source.name ?? attributes.name ?? nestedAttributes.name) } : {}),
  };
}

export function normalizeDestinationImages(value: unknown): NormalizedImage[] {
  return array(value).map(normalizeDestinationImage).filter((image): image is NormalizedImage => image !== null);
}

const rows = (value: unknown, stringField: string): RecordValue[] => array(value).flatMap(item => {
  if (typeof item === "string" || typeof item === "number") return text(item).trim() ? [{ [stringField]: text(item) }] : [];
  const current = record(item);
  return Object.keys(current).length ? [current] : [];
});

function normalizePairs(value: unknown, first: string, second: string) {
  return rows(value, first).map((item, index) => ({
    ...item,
    id: typeof item.id === "string" || typeof item.id === "number" ? item.id : `${text(item[first])}:${text(item[second])}:${index}`,
    [first]: text(item[first]),
    [second]: text(item[second]),
  }));
}

function normalizeTextRows(value: unknown, key: string) {
  return rows(value, key).map((item, index) => ({ ...item, id: item.id ?? `${text(item[key])}:${index}`, [key]: text(item[key]) }));
}

export function normalizeDestinationResponse(input: unknown): StudyIn {
  const outer = record(record(input).data ?? input);
  const content = record(outer.content);
  const source: RecordValue = { ...content, ...outer };

  const overviewValue = record(source.overview);
  const whyValue = record(source.whyStudyin ?? source.why_study);
  const costsValue = record(source.Living_Cost_Tuition_Fee ?? source.living_cost_tuition_fee ?? source.livingCosts);
  const admissionValue = record(source.admissions ?? source.admission_requirements);
  const checklistValue = record(admissionValue.checklist);
  const visaValue = record(source.visa_requirements ?? source.visaRequirements);
  const experiencesValue = record(source.students_expriences ?? source.student_experiences ?? source.students_experiences);
  const jobsValue = record(source.jobsAndOpportunities ?? source.jobs_and_opportunities);
  const coursesValue = record(source.popularCourses ?? source.popular_courses);

  const cities = rows(costsValue.cities, "city").map((city, index) => {
    const tables = rows(city.tables, "title").map((table, tableIndex) => ({
      ...table,
      id: table.id ?? `${text(table.title)}:${tableIndex}`,
      title: text(table.title),
      label_values: normalizePairs(table.label_values ?? table.labelValues, "label", "value"),
    }));
    return {
      ...city,
      id: city.id ?? `${text(city.city)}:${index}`,
      city: text(city.city),
      description: text(city.description),
      image: normalizeDestinationImage(city.image),
      tables,
    };
  });

  const quickLinkSource = source.quickLinks ?? source.quick_links;
  const quickLinks = rows(quickLinkSource, "title").flatMap(item => {
    const title = text(item.title).trim();
    const href = text(item.href ?? item.url).trim();
    return title && href ? [{ ...item, title, href }] : [];
  });

  const topUniversities = rows(source.topUniversities ?? source.top_universities, "name").map((item, index) => ({
    ...item,
    id: item.id ?? `${text(item.name)}:${index}`,
    name: text(item.name),
    website: text(item.website),
    logo: normalizeDestinationImage(item.logo),
  }));

  const popularCourseItems = coursesValue.items ?? source.popularCourseItems ?? source.popular_courses_items;
  const popularCourses = {
    ...coursesValue,
    title: text(coursesValue.title),
    items: rows(popularCourseItems, "title").map((item, index) => ({ ...item, id: item.id ?? `${text(item.title)}:${index}`, title: text(item.title), count: text(item.count) })),
  };

  const experienceImages = normalizeDestinationImages(experiencesValue.images ?? experiencesValue.photos);
  const jobs = {
    ...jobsValue,
    title: text(jobsValue.title),
    categories: rows(jobsValue.categories ?? jobsValue.items, "title").map((item, index) => ({
      ...item,
      id: item.id ?? `${text(item.title)}:${index}`,
      title: text(item.title),
      points: array(item.points ?? item.jobs).map(text).filter(Boolean),
    })),
  };

  const videos = array(source.videos ?? source.video).flatMap((item, index) => {
    const video = typeof item === "string" ? { url: item } : record(item);
    const url = text(video.url ?? video.videoUrl ?? video.video).trim();
    return url ? [{ ...video, id: video.id ?? `${url}:${index}`, title: text(video.title ?? video.name), url, thumbnail: normalizeDestinationImage(video.thumbnail ?? video.image) }] : [];
  });

  const checklist = {
    ...checklistValue,
    note: text(checklistValue.note),
    texts: normalizeTextRows(checklistValue.texts ?? admissionValue.requirements, "lists"),
  };
  const admissions = {
    ...admissionValue,
    title: text(admissionValue.title),
    subheading1: text(admissionValue.subheading1),
    subheading2: text(admissionValue.subheading2),
    description: text(admissionValue.description),
    checklist,
  };
  const visa = {
    ...visaValue,
    title: text(visaValue.title),
    subheading: text(visaValue.subheading),
    details: normalizeTextRows(visaValue.details ?? visaValue.requirements, "lists"),
  };
  const why = {
    ...whyValue,
    title: text(whyValue.title),
    description: text(whyValue.description),
    highlights_points: normalizeTextRows(whyValue.highlights_points ?? whyValue.highlightsPoints, "description"),
    whyStudyin_cards: rows(whyValue.whyStudyin_cards ?? whyValue.cards, "title").map((item, index) => ({ ...item, id: item.id ?? `${text(item.title)}:${index}`, title: text(item.title), description: text(item.description) })),
  };
  const overview = {
    ...overviewValue,
    title: text(overviewValue.title),
    description: text(overviewValue.description),
    highlights: normalizePairs(overviewValue.highlights, "label", "value"),
  };

  return {
    ...source,
    id: text(source.id),
    title: text(source.title),
    banner: normalizeDestinationImage(source.banner),
    overview,
    whyStudyin: why,
    Living_Cost_Tuition_Fee: { ...costsValue, title: text(costsValue.title), cities },
    admissions,
    visa_requirements: visa,
    students_expriences: { ...experiencesValue, title: text(experiencesValue.title), subheading: text(experiencesValue.subheading), images: experienceImages },
    quickLinks,
    topUniversities,
    popularCourses,
    jobsAndOpportunities: jobs,
    videos,
  } as unknown as StudyIn;
}

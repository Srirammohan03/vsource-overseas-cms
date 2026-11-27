// src\app\admin\ui.tsx

"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import AdminLayout from "@/app/admin/AdminLayout";
import {
  adminNavigation,
  type AdminModule,
} from "@/app/admin/admin-navigation";
import DestinationEditor, {
  DestinationForm,
  destinationFromRecord,
  emptyDestination,
} from "@/features/cms/components/DestinationEditor";
import UniversityEditor, {
  UniversityForm,
  blankUniversity,
  universityFromRecord,
} from "@/features/cms/components/UniversityEditor";
import {
  MediaPicker,
  SelectField,
  TextAreaField,
  TextField,
} from "@/features/cms/components/Fields";
import { MediaAsset } from "@/features/cms/types";
import {
  officeAreas,
  officeBranches,
  type OfficeArea,
  type OfficeBranch,
  type OfficeGalleryRecord,
} from "@/features/cms/types/office-gallery";

type Module = AdminModule;
type Row = Record<string, any>;
type OfficeGalleryForm = {
  id: string;
  branch: OfficeBranch;
  area: OfficeArea;
  media: MediaAsset[];
  status: "DRAFT" | "PUBLISHED";
};
const emptyCourse = {
  id: "",
  name: "",
  universityId: "",
  degreeLevel: "",
  duration: "",
  annualFee: "",
  currency: "",
  intakes: "",
  eligibility: "",
  description: "",
  status: "DRAFT",
  order: 0,
};
const emptyGallery = {
  id: "",
  title: "",
  slug: "",
  description: "",
  category: "",
  media: [] as MediaAsset[],
  status: "DRAFT",
  order: 0,
};
const emptyOfficeGallery: OfficeGalleryForm = {
  id: "",
  branch: "DILSUKNAGAR",
  area: "COUNSELING_AREA",
  media: [],
  status: "DRAFT",
};
const gallerySections = [
  { id: "gallery", label: "Gallery" },
  { id: "office", label: "Our Office" },
] as const;
function officeGalleryFormFromRecord(
  record: OfficeGalleryRecord,
): OfficeGalleryForm {
  return {
    id: record.id,
    branch: record.branch,
    area: record.area,
    status: record.status,
    media: record.media.flatMap(({ media, mediaId }) =>
      media ? [{ ...media, id: mediaId }] : [],
    ),
  };
}
const countries = ["UK", "USA", "Canada", "Ireland", "France"];
const input =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm";
function Notice({
  children,
  kind = "error",
}: {
  children: string;
  kind?: "error" | "success";
}) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`rounded-lg px-4 py-3 text-sm ${kind === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}
    >
      {children}
    </p>
  );
}
function MediaManager({ onMessage }: { onMessage: (v: string) => void }) {
  const [rows, setRows] = useState<Row[]>([]),
    [query, setQuery] = useState(""),
    [folder, setFolder] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const p = new URLSearchParams();
      if (query) p.set("search", query);
      if (folder) p.set("folder", folder);
      const r = await fetch(`/api/admin/media?${p}`);
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Could not load media");
      setRows(d.items || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [query, folder]);
  useEffect(() => {
    void load();
  }, [load]);
  const upload = (files: FileList | null) => {
    if (!files?.length) return;
    const data = new FormData();
    data.append("folder", folder || "general");
    Array.from(files).forEach((f) => data.append("files", f));
    const x = new XMLHttpRequest();
    x.open("POST", "/api/admin/media");
    setBusy(true);
    x.onload = () => {
      setBusy(false);
      try {
        const d = JSON.parse(x.responseText);
        if (x.status > 299) throw Error(d.error || "Upload failed");
        onMessage(`${d.length} file(s) uploaded.`);
        void load();
      } catch (e) {
        setError((e as Error).message);
      }
    };
    x.onerror = () => {
      setBusy(false);
      setError("Upload failed.");
    };
    x.send(data);
  };
  return (
    <div className="grid gap-5">
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Upload files</h2>
        <p className="mt-1 text-sm text-slate-500">
          Local persistent storage; maximum 100 MB each. Image thumbnails are
          generated on upload.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_2fr]">
          <select
            className={input}
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
          >
            <option value="">General files</option>
            {[
              "destinations",
              "universities",
              "gallery",
              "courses",
              "banners",
              "general",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <label className="cursor-pointer rounded-lg border-2 border-dashed p-4 text-center text-sm">
            Drop area / select images and videos
            <input
              className="mt-2 block w-full"
              type="file"
              multiple
              accept="image/*,video/mp4,video/webm,video/quicktime"
              onChange={(e) => upload(e.target.files)}
            />
          </label>
        </div>
      </section>
      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            className={`${input} pl-9`}
            placeholder="Search files"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          className={input + " max-w-56"}
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
        >
          <option value="">All folders</option>
          {[
            "destinations",
            "universities",
            "gallery",
            "courses",
            "banners",
            "general",
          ].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>
      {error && <Notice>{error}</Notice>}
      {busy && <p className="text-sm text-slate-500">Loading…</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((file) => (
          <article
            key={file.id}
            className="overflow-hidden rounded-xl bg-white shadow-sm"
          >
            {file.mimeType?.startsWith("video/") ? (
              <video
                controls
                src={`/media/${file.url}`}
                className="h-48 w-full bg-slate-100 object-cover"
              />
            ) : (
              <img
                loading="lazy"
                src={`/media/${file.thumbnailPath || file.url}`}
                alt={file.altText || file.name}
                className="h-48 w-full bg-slate-100 object-cover"
              />
            )}
            <div className="grid gap-2 p-3">
              <b className="truncate" title={file.name}>
                {file.name}
              </b>
              <small>
                {file.mimeType} · {Math.ceil(file.size / 1024)} KB ·{" "}
                {file.folder.toLowerCase()}
              </small>
              <label className="text-xs">
                Alt text
                <input
                  className={input}
                  defaultValue={file.altText}
                  onBlur={async (e) => {
                    if (e.target.value === file.altText) return;
                    const r = await fetch("/api/admin/media", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        id: file.id,
                        altText: e.target.value,
                      }),
                    });
                    if (r.ok) void load();
                    else setError("Alt text was not saved.");
                  }}
                />
              </label>
              <label className="cursor-pointer rounded border px-3 py-2 text-center text-sm">
                Replace file
                <input
                  className="hidden"
                  type="file"
                  accept="image/*,video/mp4,video/webm,video/quicktime"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const data = new FormData();
                    data.append("id", file.id);
                    data.append("file", f);
                    const r = await fetch("/api/admin/media", {
                      method: "PUT",
                      body: data,
                    });
                    const d = await r.json();
                    if (!r.ok) setError(d.error || "Replace failed");
                    else {
                      onMessage("Media replaced.");
                      void load();
                    }
                  }}
                />
              </label>
              <button
                className="rounded border border-red-200 px-3 py-2 text-sm text-red-700"
                onClick={async () => {
                  if (
                    !confirm(
                      "Delete this media file? Referenced files are protected.",
                    )
                  )
                    return;
                  const r = await fetch("/api/admin/media", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: file.id }),
                  });
                  const d = await r.json();
                  if (!r.ok) setError(d.error || "Delete failed");
                  else {
                    onMessage("Unused media deleted.");
                    void load();
                  }
                }}
              >
                Delete unused file
              </button>
            </div>
          </article>
        ))}
      </div>
      {!busy && !rows.length && (
        <p className="rounded-xl bg-white p-6 text-slate-500">
          No media files found.
        </p>
      )}
    </div>
  );
}

export default function AdminDashboard({
  name,
  role,
  initialModule = "dashboard",
}: {
  name: string;
  role: string;
  initialModule?: Module;
}) {
  const [module, setModule] = useState<Module>(initialModule),
    [gallerySection, setGallerySection] = useState<"gallery" | "office">("gallery"),
    [items, setItems] = useState<Row[]>([]),
    [officeItems, setOfficeItems] = useState<OfficeGalleryRecord[]>([]),
    [officeLoading, setOfficeLoading] = useState(false),
    [officeError, setOfficeError] = useState(""),
    [media, setMedia] = useState<Row[]>([]),
    [universities, setUniversities] = useState<Row[]>([]),
    [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [search, setSearch] = useState("");
  const [destination, setDestination] =
      useState<DestinationForm>(emptyDestination),
    [university, setUniversity] = useState<UniversityForm>(blankUniversity),
    [course, setCourse] = useState<Row>(emptyCourse),
    [gallery, setGallery] = useState<any>(emptyGallery),
    [officeGallery, setOfficeGallery] =
      useState<OfficeGalleryForm>(emptyOfficeGallery),
    [user, setUser] = useState<Row>({
      id: "",
      name: "",
      email: "",
      password: "",
      role: "EDITOR",
      isActive: true,
    }),
    [setting, setSetting] = useState({ key: "", value: "" }),
    [password, setPassword] = useState({
      currentPassword: "",
      newPassword: "",
    });
  const superAdmin = role === "SUPER_ADMIN";
  const isForm = [
    "destinations",
    "universities",
    "courses",
    "gallery",
    "users",
    "settings",
  ].includes(module);
  const load = useCallback(async () => {
    if (!isForm) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/${module}`);
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Could not load records");
      setItems(Array.isArray(d) ? d : []);
      if (["courses", "gallery"].includes(module)) {
        const ur = await fetch("/api/admin/universities");
        const ud = await ur.json();
        if (ur.ok) setUniversities(ud);
      }
      if (module === "media") {
        const mr = await fetch("/api/admin/media");
        const md = await mr.json();
        if (mr.ok) setMedia(md.items || []);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [module, isForm]);
  useEffect(() => {
    void load();
  }, [load]);
  const loadOfficeGallery = useCallback(async () => {
    if (module !== "gallery") return;
    setOfficeLoading(true);
    setOfficeError("");
    try {
      const response = await fetch("/api/admin/office-gallery");
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Could not load office photos.");
      setOfficeItems(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setOfficeError((loadError as Error).message);
    } finally {
      setOfficeLoading(false);
    }
  }, [module]);
  useEffect(() => {
    void loadOfficeGallery();
  }, [loadOfficeGallery]);
  const reset = () => {
    setDestination(emptyDestination());
    setUniversity(blankUniversity());
    setCourse(emptyCourse);
    setGallery(emptyGallery);
    setOfficeGallery(emptyOfficeGallery);
    setUser({
      id: "",
      name: "",
      email: "",
      password: "",
      role: "EDITOR",
      isActive: true,
    });
    setError("");
    setNotice("");
  };
  function selectOfficeLocation(branch: OfficeBranch, area: OfficeArea) {
    const record = officeItems.find(
      (item) => item.branch === branch && item.area === area,
    );
    setOfficeGallery(
      record
        ? officeGalleryFormFromRecord(record)
        : { ...emptyOfficeGallery, branch, area },
    );
    setError("");
    setNotice("");
  }
  function edit(item: Row) {
    setError("");
    setNotice("");
    if (module === "destinations") setDestination(destinationFromRecord(item));
    if (module === "universities") setUniversity(universityFromRecord(item));
    if (module === "courses")
      setCourse({ ...item, intakes: (item.intakes || []).join(", ") });
    if (module === "gallery")
      setGallery({
        id: item.id,
        title: item.title,
        slug: item.slug,
        description: item.description || "",
        category: item.category?.name || "",
        media: (item.media || []).map((m: any) => ({
          ...m.media,
          id: m.mediaId,
          altText: m.media?.altText || "",
        })),
        status: item.status,
        order: item.order || 0,
      });
    if (module === "users") setUser({ ...item, password: "" });
    if (module === "settings")
      setSetting({
        key: item.key,
        value:
          typeof item.value === "string"
            ? item.value
            : JSON.stringify(item.value),
      });
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      let resource = module,
        payload: any,
        method = "POST",
        id = "";
      if (module === "destinations") {
        payload = {
          ...destination,
          seo: {
            ...destination.seo,
            keywords: destination.seo.keywords
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean),
          },
        };
        id = destination.id;
      } else if (module === "universities") {
        payload = { ...university };
        id = university.id;
      } else if (module === "courses") {
        payload = {
          ...course,
          intakes: String(course.intakes || "")
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean),
          order: Number(course.order) || 0,
        };
        id = course.id;
      } else if (module === "gallery") {
        payload = {
          ...gallery,
          media: gallery.media.map((m: MediaAsset) => ({
            id: m.id,
            altText: m.altText || "",
          })),
          order: Number(gallery.order) || 0,
        };
        id = gallery.id;
      } else if (module === "users") {
        payload = {
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
        };
        id = user.id;
        if (id) {
          payload = {
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            ...(user.password ? { password: user.password } : {}),
          };
        }
      } else if (module === "settings") {
        payload = setting;
        id = setting.key;
        resource = "settings";
      }
      method = id ? "PATCH" : "POST";
      const url = id
        ? `/api/admin/${resource}/${encodeURIComponent(id)}`
        : `/api/admin/${resource}`;
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) {
        const fields = d.details?.fieldErrors;
        throw Error(
          fields
            ? Object.entries(fields)
                .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
                .join(" · ")
            : d.error || "Save failed",
        );
      }
      if (module === "universities") {
        const universityId = d.id;
        const g = await fetch(
          `/api/admin/universities/${universityId}/gallery`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              media: university.gallery.map((m) => ({
                id: m.id,
                altText: m.altText || "",
              })),
            }),
          },
        );
        if (!g.ok) {
          const body = await g.json();
          throw Error(
            body.error || "University saved but campus photos failed to save.",
          );
        }
      }
      setNotice(`${module.slice(0, 1).toUpperCase() + module.slice(1)} saved.`);
      reset();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(item: Row) {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    setError("");
    const r = await fetch(
      `/api/admin/${module}/${encodeURIComponent(item.id)}`,
      { method: "DELETE" },
    );
    const d = await r.json();
    if (!r.ok) setError(d.error || "Delete failed");
    else {
      setNotice("Record deleted.");
      if (item.id === destination.id || item.id === university.id) reset();
      void load();
    }
  }
  async function saveOfficeGallery(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setOfficeError("");
    setNotice("");
    try {
      const response = await fetch(
        officeGallery.id
          ? `/api/admin/office-gallery/${encodeURIComponent(officeGallery.id)}`
          : "/api/admin/office-gallery",
        {
          method: officeGallery.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branch: officeGallery.branch,
            area: officeGallery.area,
            status: officeGallery.status,
            media: officeGallery.media.map((asset) => ({
              id: asset.id,
              altText: asset.altText || "",
            })),
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Office gallery could not be saved.");
      setOfficeGallery(officeGalleryFormFromRecord(data as OfficeGalleryRecord));
      setNotice("Office photos saved.");
      await loadOfficeGallery();
    } catch (saveError) {
      setOfficeError((saveError as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function removeOfficeGallery(record: OfficeGalleryRecord) {
    if (!confirm("Delete this office area record? This cannot be undone.")) return;
    setOfficeError("");
    try {
      const response = await fetch(
        `/api/admin/office-gallery/${encodeURIComponent(record.id)}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Office photos could not be deleted.");
      if (officeGallery.id === record.id) {
        setOfficeGallery({
          ...emptyOfficeGallery,
          branch: record.branch,
          area: record.area,
        });
      }
      setNotice("Office area record deleted.");
      await loadOfficeGallery();
    } catch (deleteError) {
      setOfficeError((deleteError as Error).message);
    }
  }
  const visible = useMemo(
    () =>
      items.filter((x) =>
        JSON.stringify([
          x.name,
          x.title,
          x.slug,
          x.email,
          x.university?.name,
          x.country?.name,
        ])
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [items, search],
  );
  return (
    <AdminLayout
      name={name}
      role={role}
      activeModule={module}
      onNavigate={(selected) => {
        setModule(selected);
        reset();
      }}
    >
      <div className="grid min-w-0 gap-6 sm:gap-7">
        {error && <Notice>{error}</Notice>}
        {notice && <Notice kind="success">{notice}</Notice>}
        {module === "dashboard" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {adminNavigation.slice(1, 7).map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (n.id === "enquiries") {
                      window.location.assign("/admin/enquiries");
                      return;
                    }
                    setModule(n.id);
                    reset();
                  }}
                  className="rounded-xl bg-white p-5 text-left shadow-sm hover:shadow"
                >
                  <n.icon className="mb-4 h-5 w-5 text-red-700" />
                  <strong>{n.label}</strong>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage published content and drafts.
                  </p>
                </button>
              ))}
            </div>
            <p className="rounded-xl bg-white p-5 text-sm text-slate-600">
              Choose a module to create, edit, publish or reorder website
              content.
            </p>
          </>
        )}
        {module === "destinations" && (
          <>
            <form
              onSubmit={save}
              className="min-w-0 space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-7"
            >
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Content management
                  </p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {destination.id ? "Edit destination" : "Create destination"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage destination details, content sections and search
                    metadata.
                  </p>
                </div>
                <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C71920]/30"
                    onClick={reset}
                  >
                    New
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#C71920] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a9151b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C71920]/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy
                      ? "Saving…"
                      : destination.status === "PUBLISHED"
                        ? "Save & publish"
                        : "Save draft"}
                  </button>
                </div>
              </div>
              <DestinationEditor
                value={destination}
                onChange={setDestination}
              />
            </form>
            <RecordList
              rows={visible}
              loading={loading}
              onEdit={edit}
              onDelete={remove}
            />
          </>
        )}
        {module === "universities" && (
          <>
            <form
              onSubmit={save}
              className="min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {university.id ? "Edit university" : "Add university"}
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded border px-3 py-2"
                  >
                    New
                  </button>
                  <button
                    disabled={busy}
                    className="rounded bg-red-700 px-4 py-2 font-semibold text-white"
                  >
                    {busy
                      ? "Saving…"
                      : university.status === "PUBLISHED"
                        ? "Save & publish"
                        : "Save draft"}
                  </button>
                </div>
              </div>
              <UniversityEditor value={university} onChange={setUniversity} />
            </form>
            <RecordList
              rows={visible}
              loading={loading}
              onEdit={edit}
              onDelete={remove}
            />
          </>
        )}
        {module === "courses" && (
          <>
            <form
              onSubmit={save}
              className="grid min-w-0 grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:grid-cols-2"
            >
              <h2 className="md:col-span-2 text-lg font-semibold">
                {course.id ? "Edit course" : "Add course"}
              </h2>
              <TextField
                label="Course name"
                required
                value={course.name}
                onChange={(v) => setCourse({ ...course, name: v })}
              />
              <SelectField
                label="University"
                value={course.universityId}
                onChange={(v) => setCourse({ ...course, universityId: v })}
                options={[
                  { value: "", label: "Select university" },
                  ...universities.map((u) => ({
                    value: u.id,
                    label: `${u.name} · ${u.country?.name || ""}`,
                  })),
                ]}
              />
              <TextField
                label="Degree level"
                value={course.degreeLevel}
                onChange={(v) => setCourse({ ...course, degreeLevel: v })}
              />
              <TextField
                label="Duration"
                value={course.duration}
                onChange={(v) => setCourse({ ...course, duration: v })}
              />
              <TextField
                label="Tuition fee"
                value={course.annualFee}
                onChange={(v) => setCourse({ ...course, annualFee: v })}
              />
              <TextField
                label="Currency"
                value={course.currency}
                onChange={(v) => setCourse({ ...course, currency: v })}
              />
              <TextField
                label="Intakes (comma separated)"
                value={course.intakes}
                onChange={(v) => setCourse({ ...course, intakes: v })}
              />
              <SelectField
                label="Publication"
                value={course.status}
                onChange={(v) => setCourse({ ...course, status: v })}
                options={[
                  { value: "DRAFT", label: "Draft" },
                  { value: "PUBLISHED", label: "Published" },
                ]}
              />
              <TextAreaField
                label="Eligibility"
                value={course.eligibility}
                onChange={(v) => setCourse({ ...course, eligibility: v })}
              />
              <TextAreaField
                label="Description"
                value={course.description}
                onChange={(v) => setCourse({ ...course, description: v })}
              />
              <div className="md:col-span-2 flex gap-2">
                <button
                  className="rounded bg-red-700 px-4 py-2 font-semibold text-white"
                  disabled={busy}
                >
                  {busy ? "Saving…" : "Save course"}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded border px-4 py-2"
                >
                  New
                </button>
              </div>
            </form>
            <RecordList
              rows={visible}
              loading={loading}
              onEdit={edit}
              onDelete={remove}
            />
          </>
        )}
        {module === "gallery" && (
          <>
            <div
              role="tablist"
              aria-label="Gallery management sections"
              className="flex w-fit gap-1 rounded-xl bg-white p-1 shadow-sm"
            >
              {gallerySections.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={gallerySection === tab.id}
                  onClick={() => setGallerySection(tab.id)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    gallerySection === tab.id
                      ? "bg-[#C71920] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {gallerySection === "gallery" && (
              <>
                <form
                  onSubmit={save}
                  className="grid min-w-0 grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:grid-cols-2"
                >
                  <h2 className="md:col-span-2 text-lg font-semibold">
                    {gallery.id ? "Edit gallery item" : "Add gallery item"}
                  </h2>
                  <TextField
                    label="Title"
                    required
                    value={gallery.title}
                    onChange={(v) => setGallery({ ...gallery, title: v })}
                  />
                  <TextField
                    label="Slug"
                    required
                    value={gallery.slug}
                    onChange={(v) => setGallery({ ...gallery, slug: v })}
                  />
                  <TextField
                    label="Category"
                    value={gallery.category}
                    onChange={(v) => setGallery({ ...gallery, category: v })}
                  />
                  <SelectField
                    label="Publication"
                    value={gallery.status}
                    onChange={(v) => setGallery({ ...gallery, status: v })}
                    options={[
                      { value: "DRAFT", label: "Draft" },
                      { value: "PUBLISHED", label: "Published" },
                    ]}
                  />
                  <div className="md:col-span-2">
                    <TextAreaField
                      label="Description"
                      value={gallery.description}
                      onChange={(v) => setGallery({ ...gallery, description: v })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <MediaPicker
                      label="Gallery images"
                      folder="gallery"
                      multiple
                      value={gallery.media}
                      onChange={(v) => setGallery({ ...gallery, media: v })}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      className="rounded bg-red-700 px-4 py-2 font-semibold text-white"
                      disabled={busy}
                    >
                      {busy ? "Saving…" : "Save gallery item"}
                    </button>
                    <button
                      type="button"
                      onClick={reset}
                      className="rounded border px-4 py-2"
                    >
                      New
                    </button>
                  </div>
                </form>
                <RecordList
                  rows={visible}
                  loading={loading}
                  onEdit={edit}
                  onDelete={remove}
                />
              </>
            )}
            {gallerySection === "office" && (
              <>
                {officeError && <Notice>{officeError}</Notice>}
                <form
                  onSubmit={saveOfficeGallery}
                  className="grid min-w-0 grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:grid-cols-2"
                >
                  <div className="md:col-span-2">
                    <h2 className="text-lg font-semibold">
                      {officeGallery.id ? "Edit office photos" : "Add office photos"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Choose a branch and area, then upload or remove images. Existing photos are loaded for the selected location.
                    </p>
                  </div>
                  <SelectField
                    label="Branch"
                    value={officeGallery.branch}
                    onChange={(value) =>
                      selectOfficeLocation(value as OfficeBranch, officeGallery.area)
                    }
                    options={officeBranches}
                    disabled={officeLoading || Boolean(officeError)}
                  />
                  <SelectField
                    label="Office area"
                    value={officeGallery.area}
                    onChange={(value) =>
                      selectOfficeLocation(officeGallery.branch, value as OfficeArea)
                    }
                    options={officeAreas}
                    disabled={officeLoading || Boolean(officeError)}
                  />
                  <SelectField
                    label="Publication"
                    value={officeGallery.status}
                    onChange={(value) =>
                      setOfficeGallery({
                        ...officeGallery,
                        status: value as OfficeGalleryForm["status"],
                      })
                    }
                    options={[
                      { value: "DRAFT", label: "Draft" },
                      { value: "PUBLISHED", label: "Published" },
                    ]}
                  />
                  <div className="md:col-span-2">
                    <MediaPicker
                      label="Office gallery images"
                      folder="gallery"
                      multiple
                      value={officeGallery.media}
                      onChange={(value) =>
                        setOfficeGallery({ ...officeGallery, media: value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      className="rounded bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
                      disabled={busy || officeLoading || Boolean(officeError)}
                    >
                      {busy
                        ? "Saving…"
                        : officeGallery.status === "PUBLISHED"
                          ? "Save & publish"
                          : "Save draft"}
                    </button>
                  </div>
                </form>
                <section className="grid gap-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Office photos by branch and area
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Edit the saved images for any location or delete its record.
                    </p>
                  </div>
                  {officeLoading ? (
                    <p className="rounded-xl bg-white p-5 text-sm text-slate-500">
                      Loading office photos…
                    </p>
                  ) : officeError ? (
                    <button
                      type="button"
                      onClick={() => void loadOfficeGallery()}
                      className="w-fit rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Retry loading office photos
                    </button>
                  ) : officeBranches.map((branch) => (
                    <section
                      key={branch.value}
                      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                    >
                      <h3 className="font-bold text-slate-900">{branch.label}</h3>
                      <div className="grid gap-3 lg:grid-cols-3">
                        {officeAreas.map((area) => {
                          const record = officeItems.find(
                            (item) =>
                              item.branch === branch.value &&
                              item.area === area.value,
                          );
                          return (
                            <article
                              key={area.value}
                              className="min-w-0 rounded-xl border border-slate-200 p-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-800">
                                    {area.label}
                                  </h4>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {record
                                      ? `${record.media.length} image(s) · ${record.status === "PUBLISHED" ? "Published" : "Draft"}`
                                      : "No saved images"}
                                  </p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      record
                                        ? setOfficeGallery(officeGalleryFormFromRecord(record))
                                        : selectOfficeLocation(branch.value, area.value)
                                    }
                                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    {record ? "Edit" : "Add"}
                                  </button>
                                  {record && (
                                    <button
                                      type="button"
                                      onClick={() => void removeOfficeGallery(record)}
                                      className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                              {record?.media.length ? (
                                <div className="mt-3 grid grid-cols-3 gap-2">
                                  {record.media.map(({ media, mediaId }) =>
                                    media ? (
                                      <img
                                        key={mediaId}
                                        src={`/media/${media.thumbnailPath || media.url}`}
                                        alt={media.altText || ""}
                                        className="h-16 w-full rounded-md object-cover"
                                      />
                                    ) : null,
                                  )}
                                </div>
                              ) : null}
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </section>
              </>
            )}
          </>
        )}
        {module === "media" && <MediaManager onMessage={setNotice} />}
        {module === "users" && superAdmin && (
          <>
            <form
              onSubmit={save}
              className="grid min-w-0 grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:grid-cols-2"
            >
              <h2 className="md:col-span-2 text-lg font-semibold">
                {user.id ? "Edit account" : "Create administrator"}
              </h2>
              <TextField
                label="Name"
                required
                value={user.name}
                onChange={(v) => setUser({ ...user, name: v })}
              />
              <TextField
                label="Email"
                required
                type="email"
                value={user.email}
                onChange={(v) => setUser({ ...user, email: v })}
              />
              {!user.id && (
                <TextField
                  label="Temporary password (12+ characters)"
                  required
                  type="password"
                  value={user.password}
                  onChange={(v) => setUser({ ...user, password: v })}
                />
              )}
              <SelectField
                label="Role"
                value={user.role}
                onChange={(v) => setUser({ ...user, role: v })}
                options={[
                  { value: "ADMIN", label: "Admin" },
                  { value: "EDITOR", label: "Editor" },
                ]}
              />
              {user.id && (
                <>
                  <SelectField
                    label="Account access"
                    value={user.isActive ? "active" : "inactive"}
                    onChange={(v) =>
                      setUser({ ...user, isActive: v === "active" })
                    }
                    options={[
                      { value: "active", label: "Active" },
                      { value: "inactive", label: "Deactivated" },
                    ]}
                  />
                  <TextField
                    label="Set new password (optional, 12+ characters)"
                    type="password"
                    value={user.password}
                    onChange={(v) => setUser({ ...user, password: v })}
                  />
                </>
              )}
              <div className="md:col-span-2 flex gap-2">
                <button
                  className="rounded bg-red-700 px-4 py-2 font-semibold text-white"
                  disabled={busy}
                >
                  {busy ? "Saving…" : "Save user"}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded border px-4 py-2"
                >
                  New
                </button>
              </div>
            </form>
            <RecordList
              rows={visible}
              loading={loading}
              onEdit={edit}
              onDelete={remove}
            />
          </>
        )}
        {module === "settings" && superAdmin && (
          <>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await save(e);
              }}
              className="grid min-w-0 grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:grid-cols-2"
            >
              <h2 className="md:col-span-2 text-lg font-semibold">
                Site settings
              </h2>
              <TextField
                label="Setting key"
                required
                value={setting.key}
                onChange={(v) => setSetting({ ...setting, key: v })}
              />
              <TextField
                label="Setting value"
                value={setting.value}
                onChange={(v) => setSetting({ ...setting, value: v })}
              />
              <button className="w-fit rounded bg-red-700 px-4 py-2 text-white">
                Save setting
              </button>
            </form>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                const r = await fetch("/api/admin/password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(password),
                });
                const d = await r.json();
                setBusy(false);
                if (!r.ok) setError(d.error || "Password change failed");
                else {
                  setNotice("Password changed successfully.");
                  setPassword({ currentPassword: "", newPassword: "" });
                }
              }}
              className="grid min-w-0 grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:grid-cols-2"
            >
              <h2 className="md:col-span-2 text-lg font-semibold">
                Change your password
              </h2>
              <TextField
                label="Current password"
                type="password"
                required
                value={password.currentPassword}
                onChange={(v) =>
                  setPassword({ ...password, currentPassword: v })
                }
              />
              <TextField
                label="New password (12+ characters)"
                type="password"
                required
                value={password.newPassword}
                onChange={(v) => setPassword({ ...password, newPassword: v })}
              />
              <button className="w-fit rounded bg-slate-900 px-4 py-2 text-white">
                Update password
              </button>
            </form>
            <RecordList
              rows={visible}
              loading={loading}
              onEdit={edit}
              onDelete={remove}
            />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
function RecordList({
  rows,
  loading,
  onEdit,
  onDelete,
}: {
  rows: Row[];
  loading: boolean;
  onEdit: (row: Row) => void;
  onDelete: (row: Row) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = rows.filter((x) =>
    String(x.name || x.title || x.email || x.key || x.slug || "")
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Records{" "}
            <span className="ml-1 font-medium text-slate-400">
              ({rows.length})
            </span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            View and manage saved content entries.
          </p>
        </div>
        <input
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#C71920] focus:ring-2 focus:ring-[#C71920]/10 sm:w-64"
          placeholder="Filter records"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Filter records"
        />
      </div>
      {loading ? (
        <p className="p-5 text-sm text-slate-500">Loading records…</p>
      ) : !filtered.length ? (
        <p className="p-6 text-sm text-slate-500">No records found.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map((row) => (
            <article
              key={row.id || row.key}
              className="flex min-w-0 flex-col gap-3 p-4 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
            >
              <button
                type="button"
                onClick={() => onEdit(row)}
                className="min-w-0 flex-1 text-left"
              >
                <b className="block truncate text-sm font-semibold text-slate-900">
                  {row.name || row.title || row.email || row.key}
                </b>
                <span className="mt-1 block truncate text-xs text-slate-500">
                  {row.slug ||
                    row.country?.name ||
                    row.university?.name ||
                    row.email ||
                    row.id}{" "}
                  {row.status ||
                  row.role ||
                  (row.isActive === undefined ? "" : "Active user")
                    ? `· ${row.status || row.role || (row.isActive === undefined ? "" : "Active user")}`
                    : ""}
                </span>
              </button>
              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                {row.isActive !== undefined && (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${row.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {row.isActive ? "Active" : "Deactivated"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-[#C71920] transition hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

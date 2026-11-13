"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  Inbox,
  PhoneCall,
  Clock3,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import {
  EnquiryFilters,
  type EnquiryFilterValues,
} from "@/features/enquiries/components/EnquiryFilters";
import { EnquiryTable } from "@/features/enquiries/components/EnquiryTable";
import type {
  EnquiryRecord,
  EnquiryStatus,
  EnquirySummary,
} from "@/features/enquiries/lib/types";

const emptySummary: EnquirySummary = {
  total: 0,
  NEW: 0,
  CONTACTED: 0,
  IN_PROGRESS: 0,
  CONVERTED: 0,
  CLOSED: 0,
};

const emptyFilters: EnquiryFilterValues = {
  search: "",
  service: "",
  status: "",
  from: "",
  to: "",
};

export default function EnquiryDashboard({ role }: { role: string }) {
  const [filters, setFilters] = useState<EnquiryFilterValues>(emptyFilters);
  const [rows, setRows] = useState<EnquiryRecord[]>([]);
  const [summary, setSummary] = useState<EnquirySummary>(emptySummary);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const canDelete = role === "ADMIN" || role === "SUPER_ADMIN";

  const params = useMemo(() => {
    const value = new URLSearchParams({
      page: String(page),
      pageSize: "25",
    });

    Object.entries(filters).forEach(([key, filter]) => {
      if (filter) value.set(key, filter);
    });

    return value;
  }, [filters, page]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/enquiries?${params}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load enquiries.");
      }

      setRows(data.items || []);
      setSummary(data.summary || emptySummary);
      setTotal(data.total || 0);
      setPageCount(data.pageCount || 0);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load enquiries.",
      );
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        void load();
      },
      filters.search ? 250 : 0,
    );

    return () => window.clearTimeout(timer);
  }, [load, filters.search]);

  function changeFilters(next: EnquiryFilterValues) {
    setPage(1);
    setFilters(next);
  }

  async function updateStatus(row: EnquiryRecord, status: EnquiryStatus) {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/enquiries/${encodeURIComponent(row.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update enquiry status.");
      }

      setNotice("Enquiry status updated successfully!");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update enquiry status.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteEnquiry(row: EnquiryRecord) {
    if (
      !window.confirm(
        `Delete enquiry #${row.enquiryNumber} for ${row.studentName}?`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/enquiries/${encodeURIComponent(row.id)}`,
        { method: "DELETE" },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete enquiry.");
      }

      setNotice("Enquiry deleted successfully!");

      if (rows.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await load();
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not delete enquiry.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function exportExcelCsv() {
    setExporting(true);
    setError("");

    try {
      const exportParams = new URLSearchParams(params);
      exportParams.delete("page");
      exportParams.delete("pageSize");
      exportParams.set("format", "csv");

      const response = await fetch(`/api/admin/enquiries?${exportParams}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Export failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "vsource-enquiries.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setNotice("Enquiries exported successfully!");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not export enquiries.",
      );
    } finally {
      setExporting(false);
    }
  }

  const cards = [
    {
      label: "Total Enquiries",
      value: summary.total,
      icon: Inbox,
      color: "text-slate-600 bg-slate-100",
    },
    {
      label: "New",
      value: summary.NEW,
      icon: Inbox,
      color: "text-blue-700 bg-blue-50",
    },
    {
      label: "Contacted",
      value: summary.CONTACTED,
      icon: PhoneCall,
      color: "text-indigo-700 bg-indigo-50",
    },
    {
      label: "In Progress",
      value: summary.IN_PROGRESS,
      icon: Clock3,
      color: "text-amber-700 bg-amber-50",
    },
    {
      label: "Converted",
      value: summary.CONVERTED,
      icon: CheckCircle2,
      color: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "Closed",
      value: summary.CLOSED,
      icon: XCircle,
      color: "text-slate-500 bg-slate-100",
    },
  ];

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}

      {/* Summary cards */}
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <section
              key={card.label}
              className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-slate-500">
                  {card.label}
                </span>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.color}`}
                >
                  <Icon className="h-[17px] w-[17px]" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                {card.value}
              </p>
            </section>
          );
        })}
      </div>

      {/* Result count and export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{total}</span> matching{" "}
          {total === 1 ? "enquiry" : "enquiries"}
        </p>

        <button
          type="button"
          onClick={exportExcelCsv}
          disabled={exporting || !total}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#C71920]/30 hover:bg-red-50 hover:text-[#C71920] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Download className="h-4 w-4" />
          {exporting ? "Preparing…" : "Export for Excel"}
        </button>
      </div>

      {/* Filters */}
      <EnquiryFilters
        value={filters}
        onChange={changeFilters}
        onReset={() => changeFilters(emptyFilters)}
      />

      {busy && (
        <p className="text-xs font-medium text-slate-500">Saving changes…</p>
      )}

      {/* Enquiries table */}
      <EnquiryTable
        rows={rows}
        loading={loading}
        canDelete={canDelete}
        onStatusChange={updateStatus}
        onDelete={deleteEnquiry}
      />

      {/* Pagination */}
      <div className="flex flex-col gap-3 border-t border-slate-200/70 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-slate-500">
          Page {Math.min(page, Math.max(1, pageCount))} of{" "}
          {Math.max(1, pageCount)}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= pageCount || loading}
            onClick={() => setPage((current) => current + 1)}
            className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Refresh enquiries"
            title="Refresh enquiries"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

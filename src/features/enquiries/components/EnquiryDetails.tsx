"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Hash,
  Phone,
  UserRound,
  BriefcaseBusiness,
} from "lucide-react";
import type {
  EnquiryRecord,
  EnquiryStatus,
} from "@/features/enquiries/lib/types";
import { enquiryStatuses } from "@/features/enquiries/lib/validation";
import { formatEnquiryDateTimeIST } from "@/lib/date-format";

export default function EnquiryDetails({ id }: { id: string; role: string }) {
  const [item, setItem] = useState<EnquiryRecord | null>(null);
  const [status, setStatus] = useState<EnquiryStatus>("NEW");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function loadItem() {
      try {
        const response = await fetch(
          `/api/admin/enquiries/${encodeURIComponent(id)}`,
          { cache: "no-store" },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load this enquiry.");
        }

        if (active) {
          setItem(data);
          setStatus(data.status);
        }
      } catch (cause) {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load this enquiry.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadItem();

    return () => {
      active = false;
    };
  }, [id]);

  async function saveStatus() {
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/enquiries/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update the enquiry status.");
      }

      setItem(data);
      setStatus(data.status);
      setNotice("Enquiry status updated successfully!");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update the enquiry status.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Loading enquiry…
      </div>
    );
  }

  if (error && !item) {
    return (
      <div className="grid gap-4">
        <Link
          href="/admin/enquiries"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#C71920] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to enquiries
        </Link>
        <p
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      </div>
    );
  }

  if (!item) return null;

  const fields = [
    { label: "Enquiry ID", value: item.id, icon: Hash },
    { label: "Student name", value: item.studentName, icon: UserRound },
    { label: "Mobile number", value: item.phone, icon: Phone },
    {
      label: "Service required",
      value: item.serviceRequired,
      icon: BriefcaseBusiness,
    },
    {
      label: "Submitted (IST)",
      value: formatEnquiryDateTimeIST(item.createdAt),
      icon: CalendarDays,
    },
    {
      label: "Last updated (IST)",
      value: formatEnquiryDateTimeIST(item.updatedAt),
      icon: CalendarDays,
    },
  ];

  return (
    <div className="grid min-w-0 gap-5 sm:gap-6">
      <Link
        href="/admin/enquiries"
        className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#C71920] transition hover:gap-3"
      >
        <ArrowLeft className="h-4 w-4" /> Back to enquiries
      </Link>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}

      <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Enquiry details
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
            Enquiry #{item.enquiryNumber}
          </h2>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {fields.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/70 p-4"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                {label}
              </div>
              <p className="mt-2 break-words text-sm font-semibold text-slate-900">
                {value || "—"}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 p-4 sm:p-5">
          <label
            htmlFor="enquiry-status"
            className="text-sm font-semibold text-slate-800"
          >
            Update enquiry status
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              id="enquiry-status"
              className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[#C71920] focus:ring-2 focus:ring-[#C71920]/10 sm:max-w-xs"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as EnquiryStatus)
              }
            >
              {enquiryStatuses.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={saveStatus}
              disabled={busy || status === item.status}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#C71920] px-5 text-sm font-semibold text-white transition hover:bg-[#A9151B] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {busy ? "Saving…" : "Save status"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

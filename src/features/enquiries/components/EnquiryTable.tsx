"use client";

import Link from "next/link";
import type {
  EnquiryRecord,
  EnquiryStatus,
} from "@/features/enquiries/lib/types";
import { enquiryStatuses } from "@/features/enquiries/lib/validation";
import { formatEnquiryDateTimeIST } from "@/lib/date-format";
import {
  CalendarDays,
  Phone,
  UserRound,
  BriefcaseBusiness,
} from "lucide-react";

interface EnquiryTableProps {
  rows: EnquiryRecord[];
  loading: boolean;
  canDelete: boolean;
  onStatusChange: (row: EnquiryRecord, status: EnquiryStatus) => void;
  onDelete: (row: EnquiryRecord) => void;
}

export function EnquiryTable({
  rows,
  loading,
  canDelete,
  onStatusChange,
  onDelete,
}: EnquiryTableProps) {
  const statusClassName =
    "h-10 min-w-[132px] rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#C71920] focus:ring-2 focus:ring-[#C71920]/10";

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Loading enquiries…
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-12 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <UserRound className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-800">
          No enquiries found
        </p>
        <p className="mt-1 text-xs text-slate-500">
          No enquiries match the current filters. Try changing your search
          criteria.
        </p>
      </div>
    );
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {/* Mobile cards */}
      <div className="grid gap-3 p-3 sm:p-4 md:hidden">
        {rows.map((row) => (
          <article
            key={row.id}
            className="min-w-0 rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Enquiry #{row.enquiryNumber}
                </p>
                <h3 className="mt-1 break-words text-sm font-bold text-slate-900">
                  {row.studentName}
                </h3>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                {row.status.replaceAll("_", " ")}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-xs text-slate-600">
              <div className="flex min-w-0 items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="break-all">{row.phone}</span>
              </div>
              <div className="flex min-w-0 items-start gap-2">
                <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span className="break-words">{row.serviceRequired}</span>
              </div>
              <div className="flex min-w-0 items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>{formatEnquiryDateTimeIST(row.createdAt)}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4">
              <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                Update status
                <select
                  aria-label={`Status for enquiry ${row.enquiryNumber}`}
                  className={statusClassName}
                  value={row.status}
                  onChange={(event) =>
                    onStatusChange(row, event.target.value as EnquiryStatus)
                  }
                >
                  {enquiryStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-2">
                <Link
                  className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  href={`/admin/enquiries/${encodeURIComponent(row.id)}`}
                >
                  View enquiry
                </Link>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(row)}
                    className="min-h-10 rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Tablet and desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-5 py-4">S.No</th>
              <th className="whitespace-nowrap px-5 py-4">Student name</th>
              <th className="whitespace-nowrap px-5 py-4">Number</th>
              <th className="whitespace-nowrap px-5 py-4">Created at</th>
              <th className="whitespace-nowrap px-5 py-4">Service required</th>
              <th className="whitespace-nowrap px-5 py-4">Status</th>
              <th className="whitespace-nowrap px-5 py-4">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={row.id}
                className="align-middle transition-colors hover:bg-slate-50/70"
              >
                <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">
                  {row.enquiryNumber}
                </td>
                <td className="max-w-[220px] px-5 py-4 font-semibold text-slate-900">
                  <span className="block truncate">{row.studentName}</span>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                  {row.phone}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                  {formatEnquiryDateTimeIST(row.createdAt)}
                </td>
                <td className="max-w-[220px] px-5 py-4 text-slate-600">
                  <span className="block truncate">{row.serviceRequired}</span>
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <select
                    aria-label={`Status for enquiry ${row.enquiryNumber}`}
                    className={statusClassName}
                    value={row.status}
                    onChange={(event) =>
                      onStatusChange(row, event.target.value as EnquiryStatus)
                    }
                  >
                    {enquiryStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      href={`/admin/enquiries/${encodeURIComponent(row.id)}`}
                    >
                      View
                    </Link>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

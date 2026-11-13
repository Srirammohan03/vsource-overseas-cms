"use client";

import type { ChangeEvent } from "react";
import { RotateCcw } from "lucide-react";
import {
  enquiryServices,
  enquiryStatuses,
} from "@/features/enquiries/lib/validation";

export type EnquiryFilterValues = {
  search: string;
  service: string;
  status: string;
  from: string;
  to: string;
};

interface EnquiryFiltersProps {
  value: EnquiryFilterValues;
  onChange: (next: EnquiryFilterValues) => void;
  onReset: () => void;
}

export function EnquiryFilters({
  value,
  onChange,
  onReset,
}: EnquiryFiltersProps) {
  const set = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onChange({
      ...value,
      [event.target.name]: event.target.value,
    });
  };

  const fieldClassName =
    "h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#C71920] focus:ring-2 focus:ring-[#C71920]/10";

  const labelClassName =
    "grid min-w-0 gap-1.5 text-xs font-semibold text-slate-600";

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12 xl:items-end">
        <label className={`${labelClassName} xl:col-span-3`}>
          Search name or mobile
          <input
            className={fieldClassName}
            name="search"
            value={value.search}
            onChange={set}
            placeholder="Search enquiries"
            autoComplete="off"
          />
        </label>

        <label className={`${labelClassName} xl:col-span-2`}>
          Service
          <select
            className={fieldClassName}
            name="service"
            value={value.service}
            onChange={set}
          >
            <option value="">All services</option>
            {enquiryServices.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </label>

        <label className={`${labelClassName} xl:col-span-2`}>
          Status
          <select
            className={fieldClassName}
            name="status"
            value={value.status}
            onChange={set}
          >
            <option value="">All statuses</option>
            {enquiryStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <label className={`${labelClassName} xl:col-span-2`}>
          From (IST date)
          <input
            className={fieldClassName}
            type="date"
            name="from"
            value={value.from}
            onChange={set}
          />
        </label>

        <label className={`${labelClassName} xl:col-span-2`}>
          To (IST date)
          <input
            className={fieldClassName}
            type="date"
            name="to"
            value={value.to}
            onChange={set}
          />
        </label>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-[#C71920]/30 hover:bg-red-50 hover:text-[#C71920] xl:col-span-1"
        >
          <RotateCcw className="h-4 w-4 xl:hidden 2xl:block" />
          <span>Reset</span>
        </button>
      </div>
    </section>
  );
}

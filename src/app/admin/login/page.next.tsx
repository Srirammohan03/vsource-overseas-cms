"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  ShieldCheck,
  GraduationCap,
  Layers3,
  Users,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default function AdminLogin() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (busy) return;

    setBusy(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error || !result?.ok) {
        setError("Invalid email or password. Please try again.");
        setBusy(false);
        return;
      }

      window.location.assign("/admin");
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#F5F6F8] lg:h-dvh lg:overflow-hidden">
      <div className="grid min-h-dvh w-full lg:h-full lg:grid-cols-2">
        {/* LEFT BRANDING PANEL */}
        <section className="relative flex min-h-[440px] flex-col overflow-hidden bg-gradient-to-br from-[#E92736] via-[#D91425] to-[#A90012] px-6 py-7 text-white sm:px-10 sm:py-9 lg:min-h-0 lg:px-12 lg:py-10 xl:px-16">
          {/* Background decorations */}
          <div className="pointer-events-none absolute -right-40 -top-40 h-[450px] w-[450px] rounded-full border border-white/[0.08]" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full border border-white/[0.08]" />
          <div className="pointer-events-none absolute -bottom-52 -left-28 h-[420px] w-[420px] rounded-full border border-white/[0.08]" />

          {/* Brand */}
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-[70px] w-[116px] shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white p-2 shadow-lg">
              <Image
                src="/assets/images/red%20vs%20logo.webp"
                alt="VSource Overseas Consultants"
                width={220}
                height={100}
                priority
                className="h-full w-full object-contain"
              />
            </div>

            <div className="border-l border-white/30 pl-4">
              <h1 className="whitespace-nowrap text-lg font-extrabold tracking-tight sm:text-2xl">
                VSource CMS
              </h1>

              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/80 sm:text-xs sm:tracking-[0.22em]">
                Content Management System
              </p>
            </div>
          </div>

          {/* Main branding content */}
          <div className="relative z-10 my-auto max-w-[620px] py-12 lg:py-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/95 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-white" />
              YOUR DIGITAL WORKSPACE
            </div>

            <h2 className="max-w-[650px] text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl xl:text-[58px]">
              Manage your entire{" "}
              <span className="text-white/75">digital presence</span> from one
              place.
            </h2>

            <p className="mt-6 max-w-[510px] text-sm leading-7 text-white/85 sm:text-base sm:leading-8">
              A centralized platform to manage study destinations, universities,
              courses, gallery, enquiries and website content with ease.
            </p>
          </div>

          {/* Left footer */}

          <footer className="relative z-10 mt-8 border-t border-white/20 py-5">
            <p className="text-center text-xs leading-6 text-white/90 sm:text-sm lg:text-left">
              © {new Date().getFullYear()} All rights reserved. Powered by{" "}
              <Link
                href="https://www.outrightcreators.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white transition-colors hover:text-white/75 hover:underline"
              >
                Outright Creators
              </Link>
            </p>
          </footer>
        </section>

        {/* RIGHT LOGIN PANEL */}
        <section className="relative flex min-h-[560px] items-center justify-center bg-white px-5 py-12 sm:px-10 lg:min-h-0 lg:px-12 lg:py-10">
          <div className="w-full max-w-[460px]">
            {/* Mobile brand */}
            <div className="mb-10 flex items-center justify-center gap-3 lg:hidden">
              <Image
                src="/assets/images/red%20vs%20logo.webp"
                alt="VSource"
                width={150}
                height={65}
                className="h-12 w-auto object-contain"
              />
              <span className="border-l border-slate-200 pl-3 text-sm font-bold text-slate-800">
                VSource CMS
              </span>
            </div>

            {/* Login heading */}
            <div className="mb-9">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C71920]/[0.08]">
                <LockKeyhole className="h-7 w-7 text-[#C71920]" />
              </div>

              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#C71920]">
                Welcome Back
              </p>

              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[36px]">
                Admin Sign In
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Sign in to access your VSource CMS workspace. Manage your
                website from one centralized platform.
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={submit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-800"
                >
                  Email address
                </label>

                <div className="group flex h-[52px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-[#C71920] focus-within:ring-4 focus-within:ring-[#C71920]/[0.08]">
                  <Mail className="h-[18px] w-[18px] shrink-0 text-slate-400 transition group-focus-within:text-[#C71920]" />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="Enter your email address"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-800"
                >
                  Password
                </label>

                <div className="group flex h-[52px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-[#C71920] focus-within:ring-4 focus-within:ring-[#C71920]/[0.08]">
                  <LockKeyhole className="h-[18px] w-[18px] shrink-0 text-slate-400 transition group-focus-within:text-[#C71920]" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C71920]/30"
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={busy}
                className="group flex h-[54px] w-full items-center justify-center gap-3 rounded-xl bg-[#C71920] px-5 text-sm font-bold text-white shadow-lg shadow-[#C71920]/15 transition-all duration-200 hover:bg-[#A90F18] hover:shadow-xl hover:shadow-[#C71920]/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#C71920]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to Dashboard
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Security footer */}
            <div className="mt-8 border-t border-slate-100 pt-7">
              <div className="flex items-center justify-center gap-2.5 text-center">
                <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-emerald-600" />
                <p className="text-xs font-medium text-slate-500 sm:text-sm">
                  Secure administrator authentication
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

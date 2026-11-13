"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";

import { adminNavigation, type AdminModule } from "./admin-navigation";

interface AdminLayoutProps {
  name: string;
  role: string;
  activeModule: AdminModule;
  children: ReactNode;
  heading?: string;
  onNavigate?: (module: AdminModule) => void;
}

export default function AdminLayout({
  name,
  role,
  activeModule,
  children,
  heading,
  onNavigate,
}: AdminLayoutProps) {
  const [mobileNav, setMobileNav] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const router = useRouter();
  const superAdmin = role === "SUPER_ADMIN";

  const currentPage = adminNavigation.find((item) => item.id === activeModule);

  const pageTitle = heading || currentPage?.label || "Dashboard";

  const sidebarWidth = collapsed ? "76px" : "252px";

  const visibleNavigation = adminNavigation.filter(
    (item) => superAdmin || !["users", "settings"].includes(item.id),
  );

  function navigate(module: AdminModule) {
    setMobileNav(false);

    if (module === "enquiries") {
      if (activeModule !== "enquiries") {
        router.push("/admin/enquiries");
      }
      return;
    }

    if (onNavigate) {
      onNavigate(module);
    } else {
      router.push(
        module === "dashboard" ? "/admin" : `/admin?module=${module}`,
      );
    }
  }

  function NavigationItems({ isMobile = false }: { isMobile?: boolean }) {
    return (
      <nav className="flex flex-col gap-1.5" aria-label="Admin navigation">
        {visibleNavigation.map((item) => {
          const Icon = item.icon;
          const active = activeModule === item.id;

          return (
            <button
              key={item.id}
              type="button"
              title={collapsed && !isMobile ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              onClick={() => navigate(item.id)}
              className={`
                group relative flex h-10 w-full shrink-0
                items-center rounded-xl
                text-left text-[13px] font-medium
                transition-all duration-200
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[#C71920]/30
                ${collapsed && !isMobile ? "justify-center px-2" : "gap-3 px-3"}
                ${
                  active
                    ? "bg-[#C71920]/[0.07] font-semibold text-[#C71920]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }
              `}
            >
              {active && (
                <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#C71920]" />
              )}

              <Icon
                className={`
                  h-[18px] w-[18px] shrink-0
                  ${
                    active
                      ? "text-[#C71920]"
                      : "text-slate-400 group-hover:text-slate-700"
                  }
                `}
                strokeWidth={active ? 2.3 : 1.8}
              />

              {(!collapsed || isMobile) && (
                <>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>

                  {active && (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#C71920]/60" />
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F5F6F8] text-slate-900">
      {/* ================= HEADER ================= */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white px-4 shadow-[0_1px_3px_rgba(15,23,42,0.03)] sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile Menu */}
          <button
            type="button"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Brand */}
          <button
            type="button"
            onClick={() => navigate("dashboard")}
            className="flex shrink-0 items-center gap-2"
            aria-label="VSource CMS dashboard"
          >
            <span className="text-[19px] font-extrabold tracking-tight text-slate-950">
              VSource
            </span>

            <span className="text-[18px] font-medium text-[#C71920]">CMS</span>
          </button>

          <span className="hidden h-6 w-px bg-slate-200 sm:block" />
          {/* Sidebar Top Header */}
          <div
            className={`
            flex h-[58px] shrink-0 items-center
            border-b border-slate-100 hidden md:flex
            ${collapsed ? "justify-center px-2" : "justify-between px-4"}
          `}
          >
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-lg text-slate-500
              transition-all duration-200
              hover:bg-red-50 hover:text-[#C71920]
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-[#C71920]/30
            "
            >
              {collapsed ? (
                <PanelLeftOpen className="h-[18px] w-[18px]" />
              ) : (
                <PanelLeftClose className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2.5 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C71920]/10 text-sm font-bold text-[#C71920]">
              {name.charAt(0).toUpperCase()}
            </div>

            <div className="hidden flex-col lg:flex">
              <span className="max-w-48 truncate text-xs font-semibold text-slate-800">
                {name}
              </span>

              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                {role.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <span className="hidden h-7 w-px bg-slate-200 sm:block" />

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-[#C71920]/30 hover:bg-red-50 hover:text-[#C71920]"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside
        className={`
          fixed bottom-0 left-0 top-[68px] z-40
          hidden flex-col overflow-hidden
          border-r border-slate-200/80 bg-white
          transition-[width] duration-300 ease-in-out
          md:flex
          ${collapsed ? "w-[76px]" : "w-[252px]"}
        `}
      >
   
        {/* Navigation - Fixed Sidebar, No Scroll */}
        <div className="flex-1 overflow-hidden px-3 py-4">
          <NavigationItems />
        </div>

        {/* Sidebar Footer */}
        <div className="shrink-0 border-t border-slate-100 px-3 py-3">
          {!collapsed ? (
            <div className="flex items-center gap-2 px-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-[11px] font-medium text-slate-400">
                CMS Workspace
              </span>
            </div>
          ) : (
            <div className="flex justify-center">
              <span
                className="h-2 w-2 rounded-full bg-emerald-500"
                title="CMS Workspace"
              />
            </div>
          )}
        </div>
      </aside>

      {/* ================= MOBILE SIDEBAR ================= */}
      {mobileNav && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/40 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileNav(false)}
        >
          <aside
            className="fixed bottom-0 left-0 top-0 flex w-[min(290px,85vw)] flex-col overflow-hidden bg-white shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Mobile Header */}
            <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-slate-100 px-5">
              <div>
                <span className="text-lg font-extrabold text-slate-950">
                  VSource
                </span>

                <span className="ml-1 text-lg font-medium text-[#C71920]">
                  CMS
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMobileNav(false)}
                aria-label="Close navigation"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex-1 overflow-hidden px-3 py-5">
              <NavigationItems isMobile />
            </div>

            {/* Mobile Footer */}
            <div className="shrink-0 border-t border-slate-100 p-4">
              <p className="text-xs font-semibold text-slate-800">{name}</p>

              <p className="mt-1 text-[10px] text-slate-400">
                {role.replace(/_/g, " ")}
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* ================= MAIN WORKSPACE ================= */}
      <main
        className={`
          min-h-screen pt-[68px]
          transition-[margin] duration-300 ease-in-out
          ${collapsed ? "md:ml-[76px]" : "md:ml-[252px]"}
        `}
      >
        <div className="min-w-0 bg-[#F5F6F8] px-4 pb-8 pt-7 sm:px-6 lg:px-8">
          {/* Page Heading */}
          <div className="mb-6">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
              <LayoutDashboard className="h-3.5 w-3.5" />

              <ChevronRight className="h-3 w-3" />

              <span className="text-slate-500">{pageTitle}</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
              {pageTitle}
            </h1>
          </div>

          {/* Existing CMS Content */}
          {children}
        </div>
      </main>
    </div>
  );
}

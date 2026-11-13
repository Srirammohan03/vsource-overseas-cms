"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const LegacyClientApp = dynamic(() => import("./legacy-client-app"), { ssr: false });

export default function AppClient({ initialPath }: { initialPath?: string }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, refetchInterval: false, retry: false } } }));
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    const path = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;
    if (window.location.pathname + window.location.search !== path) window.history.replaceState({ ...(window.history.state || {}), as: path, url: path }, "", path);
  }, [pathname, searchParams]);
  useEffect(() => {
    if (initialPath && window.location.pathname !== initialPath) window.history.replaceState({ ...(window.history.state || {}), as: initialPath, url: initialPath }, "", initialPath);
  }, [initialPath]);
  return <QueryClientProvider client={queryClient}><TooltipProvider><Toaster/><Sonner/><LegacyClientApp/></TooltipProvider></QueryClientProvider>;
}

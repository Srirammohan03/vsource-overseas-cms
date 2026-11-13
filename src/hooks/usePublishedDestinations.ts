import { useQuery } from "@tanstack/react-query";

export type PublishedDestination = {
  id: string;
  name: string;
  code: string;
  flag: string | null;
  countrySlug: string;
  destinationTitle: string;
  destinationSlug: string;
};

async function fetchPublishedDestinations(): Promise<PublishedDestination[]> {
  const response = await fetch("/api/public/destinations?dropdown=true", {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Could not load study destinations.");
  return response.json();
}

export function usePublishedDestinations() {
  const query = useQuery({
    queryKey: ["public", "destination-dropdown"],
    queryFn: fetchPublishedDestinations,
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  return {
    destinations: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

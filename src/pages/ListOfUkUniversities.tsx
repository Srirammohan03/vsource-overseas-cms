import React, { useEffect } from "react";
import { ExploreUniversitiesResponse } from "@/lib/Universities";
import UniversityHomePageSkeleton from "@/Loaders/LandingPages/UniversityHomePageSkeleton";
import UniversityList from "@/components/UniversityList";
import { toast } from "sonner";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

// Fetch all UK universities using the existing public API
export const fetchAllUkUniversities =
  async (): Promise<ExploreUniversitiesResponse> => {
    const fetchPage = async (page: number) => {
      const { data } = await axios.get(
        `/api/public/universities?page=${page}&country=${encodeURIComponent("UK")}`,
      );

      return data;
    };

    // Fetch first page
    const firstPage = await fetchPage(1);

    const totalPages = firstPage?.pagination?.pageCount ?? 1;

    // Fetch remaining pages
    const remainingPages =
      totalPages > 1
        ? await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, index) =>
              fetchPage(index + 2),
            ),
          )
        : [];

    // Combine all universities
    const universities = [
      ...(firstPage?.universities || []),
      ...remainingPages.flatMap((result) => result?.universities || []),
    ];

    return {
      universities,
      pagination: {
        page: 1,
        pageSize: universities.length,
        pageCount: 1,
        total: universities.length,
      },
    };
  };

// React Query hook
export function useAllUkUniversities() {
  return useQuery<ExploreUniversitiesResponse>({
    queryKey: ["allUkUniversities"],
    queryFn: fetchAllUkUniversities,
    staleTime: 10 * 60 * 1000,
  });
}

const ListOfUkUniversities: React.FC = () => {
  const {
    data: UNIVERSITIES,
    isLoading,
    isError,
    error,
  } = useAllUkUniversities();

  useEffect(() => {
    if (isError) {
      console.error(error);
      toast.error("Failed to load UK universities");
    }
  }, [isError, error]);

  if (isLoading) {
    return <UniversityHomePageSkeleton />;
  }

  if (isError) {
    return (
      <div className="text-center py-20 text-red-600">
        Failed to load UK universities.
      </div>
    );
  }

  const ukUniversities = UNIVERSITIES?.universities ?? [];

  return (
    <>
      {/* Banner */}
      <section className="pt-36 pb-20 bg-gradient-to-b from-darkblue to-gray-900 text-white">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            List of UK Universities
          </h1>
          <p className="text-xl text-gray-300">Study in Top UK Universities</p>
        </div>
      </section>

      {/* UK Universities */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 text-gray-700 font-medium">
          Showing{" "}
          <span className="font-semibold text-red-600">
            {ukUniversities.length}
          </span>{" "}
          UK universities
        </div>

        {ukUniversities.length > 0 ? (
          <UniversityList universities={ukUniversities} />
        ) : (
          <div className="text-center py-16 text-gray-500">
            No UK universities found.
          </div>
        )}
      </section>
    </>
  );
};

export default ListOfUkUniversities;

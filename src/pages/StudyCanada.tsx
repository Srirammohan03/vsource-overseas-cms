import React, { Suspense, lazy, useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import BannerSkeleton from "@/Loaders/about-us/BannerSkeleton";
import { StudyIn } from "@/types/StudyInPage";
import { normalizeDestinationResponse } from "@/utils/destinationContent";

// 🔹 Lazy load heavy content sections
const HeroBanner = lazy(() => import("../components/canada/HeroBanner"));
const QuickLinksSection = lazy(
  () => import("../components/canada/QuickLinksSection")
);
const OverviewHighlights = lazy(
  () => import("../components/canada/OverviewHighlights")
);
const WhyStudycanada = lazy(
  () => import("../components/canada/WhyStudycanada")
);
const CityCostsTabs = lazy(() => import("../components/canada/CityCostsTabs"));
const AdmissionRequirementscanada = lazy(
  () => import("../components/canada/AdmissionRequirementscanada")
);
const StudentVisacanada = lazy(
  () => import("../components/canada/StudentVisacanada")
);
const PopularCourses = lazy(
  () => import("../components/canada/PopularCourses")
);
const JobsIncanada = lazy(() => import("../components/canada/JobsIncanada"));
const LogoMarquee = lazy(() => import("../components/canada/LogoMarquee"));
const VideoCarousel = lazy(() => import("@/components/home/VideoCarousel"));

export const fetchStudyInCanada = async () => {
  const { data } = await axios.get("/api/public/destinations?slug=study-in-canada");
  return normalizeDestinationResponse(data);
};

const StudyCanada = () => {
  const {
    data: studyInCanada,
    isLoading,
    isError,
    error,
  } = useQuery<StudyIn>({
    queryKey: ["studyInCanada"],
    queryFn: fetchStudyInCanada,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isError) {
    toast.error("failed to load study in canada");
    console.error("failed to load study in canada", error);
    return null;
  }

  if (isLoading || !studyInCanada) {
    return <BannerSkeleton />;
  }

  return (
    <Suspense fallback={<BannerSkeleton />}>
      <HeroBanner
        banner={studyInCanada?.banner || null}
        title={studyInCanada?.title}
      />

      {/* Quick links (solid red pills) */}
      <QuickLinksSection links={studyInCanada?.quickLinks} />

      {/* Anchor: Overview */}
      <section id="overview" className="anchor-section">
        <OverviewHighlights overview={studyInCanada?.overview || null} />
        <WhyStudycanada whyStudyin={studyInCanada?.whyStudyin || null} />
      </section>

      {/* Anchor: Costs */}
      <section id="costs" className="anchor-section">
        <CityCostsTabs
          living_Cost_Tuition_Fee={
            studyInCanada?.Living_Cost_Tuition_Fee || null
          }
        />
      </section>

      {/* Anchor: Admissions */}
      <section id="admissions" className="anchor-section">
        <AdmissionRequirementscanada
          admissions={studyInCanada?.admissions || null}
        />
        <StudentVisacanada
          visa_requirements={studyInCanada?.visa_requirements || null}
        />
      </section>

      {/* Anchor: Top Universities */}
      <section id="top-universities" className="anchor-section">
        <LogoMarquee universities={studyInCanada?.topUniversities} />
      </section>

      <PopularCourses items={studyInCanada?.popularCourses?.items} heading={studyInCanada?.popularCourses?.title} />

      {/* Anchor: Jobs */}
      {/* <section id="jobs" className="anchor-section">
        <JobsIncanada
          students_expriences={studyInCanada?.students_expriences || null}
          jobsAndOpportunities={studyInCanada?.jobsAndOpportunities}
        />
      </section> */}

      <VideoCarousel items={studyInCanada?.videos} />

      {/* Small helpers for smooth anchor spacing under fixed header */}
      <style>{`
        html { scroll-behavior: smooth; }
        .anchor-section { scroll-margin-top: 100px; } /* adjust for your fixed header */
      `}</style>
    </Suspense>
  );
};

export default StudyCanada;

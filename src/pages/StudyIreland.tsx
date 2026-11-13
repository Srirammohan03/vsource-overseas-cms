// Vsource-frontend\src\pages\StudyIreland.tsx
import React, { Suspense, lazy, useEffect } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import BannerSkeleton from "@/Loaders/about-us/BannerSkeleton";
import { StudyIn } from "@/types/StudyInPage";
import { normalizeDestinationResponse } from "@/utils/destinationContent";

const HeroBanner = lazy(() => import("../components/ireland/HeroBanner"));
const QuickLinksSection = lazy(
  () => import("../components/ireland/QuickLinksSection")
);
const OverviewHighlights = lazy(
  () => import("../components/ireland/OverviewHighlights")
);
const WhyStudyireland = lazy(
  () => import("../components/ireland/WhyStudyireland")
);
const CityCostsTabs = lazy(() => import("../components/ireland/CityCostsTabs"));
const AdmissionRequirementsireland = lazy(
  () => import("../components/ireland/AdmissionRequirementsireland")
);
const StudentVisaireland = lazy(
  () => import("../components/ireland/StudentVisaireland")
);
const PopularCourses = lazy(
  () => import("../components/ireland/PopularCourses")
);
const JobsInireland = lazy(() => import("../components/ireland/JobsInireland"));
const LogoMarquee = lazy(() => import("../components/ireland/LogoMarquee"));
const VideoCarousel = lazy(() => import("@/components/home/VideoCarousel"));

export const fetchStudyInIreland = async () => {
  const { data } = await axios.get("/api/public/destinations?slug=study-in-ireland");
  return normalizeDestinationResponse(data);
};

const StudyIreland = () => {
  const {
    data: studyInIreland,
    isLoading,
    isError,
    error,
  } = useQuery<StudyIn>({
    queryKey: ["studyInIreland"],
    queryFn: fetchStudyInIreland,
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

  if (isLoading || !studyInIreland) {
    return <BannerSkeleton />;
  }

  return (
    <Suspense fallback={<BannerSkeleton />}>
      <HeroBanner
        banner={studyInIreland?.banner || null}
        title={studyInIreland?.title}
      />

      {/* Quick links (solid red pills) */}
      <QuickLinksSection links={studyInIreland?.quickLinks} />

      {/* Anchor: Overview */}
      <section id="overview" className="anchor-section">
        <OverviewHighlights overview={studyInIreland?.overview || null} />
        <WhyStudyireland whyStudyin={studyInIreland?.whyStudyin || null} />
      </section>

      {/* Anchor: Costs */}
      <section id="costs" className="anchor-section">
        <CityCostsTabs
          living_Cost_Tuition_Fee={
            studyInIreland?.Living_Cost_Tuition_Fee || null || null
          }
        />
      </section>

      {/* Anchor: Admissions */}
      <section id="admissions" className="anchor-section">
        <AdmissionRequirementsireland
          admissions={studyInIreland?.admissions || null}
        />
        <StudentVisaireland
          visa_requirements={studyInIreland?.visa_requirements || null}
        />
      </section>

      {/* Anchor: Top Universities */}
      <section id="top-universities" className="anchor-section">
        <LogoMarquee universities={studyInIreland?.topUniversities} />
      </section>

      <PopularCourses items={studyInIreland?.popularCourses?.items} heading={studyInIreland?.popularCourses?.title} />

      {/* Anchor: Jobs */}
      <section id="jobs" className="anchor-section">
        <JobsInireland
          students_expriences={studyInIreland?.students_expriences || null}
          jobsAndOpportunities={studyInIreland?.jobsAndOpportunities}
        />
      </section>

      <VideoCarousel items={studyInIreland?.videos} />

      {/* Small helpers for smooth anchor spacing under fixed header */}
      <style>{`
        html { scroll-behavior: smooth; }
        .anchor-section { scroll-margin-top: 100px; } /* adjust for your fixed header */
      `}</style>
    </Suspense>
  );
};

export default StudyIreland;

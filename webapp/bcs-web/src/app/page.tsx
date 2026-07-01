// src/app/page.tsx
import React from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import HeroSection from "@/components/home/hero-section";
import FeaturesSection from "@/components/home/features-section";
import StatsSection from "@/components/home/stats-section";
import CTASection from "@/components/home/cta-section";
import TestimonialsSection from "@/components/home/testimonials-section";
import HowItWorksSection from "@/components/home/how-it-works-section";
import CourseHighlightsSection from "@/components/home/course-highlights-section";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <CourseHighlightsSection />
        <TestimonialsSection />
        <CTASection />
      </main>
    </div>
  );
}

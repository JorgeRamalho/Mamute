import { useEffect } from "react";
import { useLocation } from "react-router";
import { Hero } from "../components/hero/Hero";
import { MamuteSpotlightSection } from "../components/home/MamuteSpotlightSection";
import { CabinetLayersSection } from "../components/home/CabinetLayersSection";
import { VisorTechSection } from "../components/home/VisorTechSection";
import { LegalSection } from "../components/legal/LegalSection";
import { BoothFaqSection } from "../components/plans/BoothFaqSection";
import { PlansSection } from "../components/plans/PlansSection";

export function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  return (
    <div className="page">
      <Hero />
      <MamuteSpotlightSection />
      <VisorTechSection />
      <CabinetLayersSection />
      <BoothFaqSection />
      <PlansSection />
      <LegalSection />
    </div>
  );
}

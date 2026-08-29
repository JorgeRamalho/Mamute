import { Hero } from "../components/hero/Hero";
import { MamuteSpotlightSection } from "../components/home/MamuteSpotlightSection";
import { CabinetLayersSection } from "../components/home/CabinetLayersSection";
import { VisorTechSection } from "../components/home/VisorTechSection";
import { BoothFaqSection } from "../components/plans/BoothFaqSection";
import { PlansSection } from "../components/plans/PlansSection";

export function HomePage() {
  return (
    <div className="page">
      <Hero />
      <MamuteSpotlightSection />
      <VisorTechSection />
      <CabinetLayersSection />
      <BoothFaqSection />
      <PlansSection />
    </div>
  );
}

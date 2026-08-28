import { Hero } from "../components/hero/Hero";
import { CabinetLayersSection } from "../components/home/CabinetLayersSection";
import { VisorTechSection } from "../components/home/VisorTechSection";
import { PlansSection } from "../components/plans/PlansSection";

export function HomePage() {
  return (
    <div className="page">
      <Hero />
      <CabinetLayersSection />
      <VisorTechSection />
      <PlansSection />
    </div>
  );
}

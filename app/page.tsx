import { BrandStory } from "@/components/BrandStory";
import { EquipmentFeatures } from "@/components/EquipmentFeatures";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";
import { GalleryPreview } from "@/components/GalleryPreview";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { MenuPreview } from "@/components/MenuPreview";
import { ServicesGrid } from "@/components/ServicesGrid";
import { TrustBar } from "@/components/TrustBar";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fffaf0]">
      <Header />
      <Hero />
      <TrustBar />
      <BrandStory />
      <ServicesGrid />
      <MenuPreview />
      <EquipmentFeatures />
      <GalleryPreview />
      <HowItWorks />
      <FinalCta />
      <Footer />
    </main>
  );
}

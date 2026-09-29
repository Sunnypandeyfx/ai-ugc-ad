import Hero from "@/components/sections/Hero";
import BuiltFor from "@/components/sections/BuiltFor";
import WorkflowFlow from "@/components/sections/WorkflowFlow";
import Comparison from "@/components/sections/Comparison";
import StyleGallery from "@/components/sections/StyleGallery";
import FinalCTA from "@/components/sections/FinalCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <BuiltFor />
      <WorkflowFlow />
      <Comparison />
      <StyleGallery />
      <FinalCTA />
    </>
  );
}

import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { Problem } from "@/components/Problem";
import { ThreeClicks } from "@/components/ThreeClicks";
import { HowItWorks } from "@/components/HowItWorks";
import { Features } from "@/components/Features";
import { Comparison } from "@/components/Comparison";
import { Trust } from "@/components/Trust";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <StatsBar />
      <Problem />
      <ThreeClicks />
      <HowItWorks />
      <Features />
      <Comparison />
      <Trust />
      <CTA />
      <Footer />
    </>
  );
}

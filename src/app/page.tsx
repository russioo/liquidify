import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Protocol from "@/components/Protocol";
import Mechanics from "@/components/Mechanics";
import AgentFeed from "@/components/AgentFeed";
import Architecture from "@/components/Architecture";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navigation />
      <Hero />
      <Protocol />
      <Mechanics />
      <AgentFeed />
      <Architecture />
      <CTA />
      <Footer />
    </>
  );
}

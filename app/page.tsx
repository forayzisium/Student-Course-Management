import React from 'react';
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Stats from "../components/Stats";
import Features from "../components/Features";
import RoleCards from "../components/RoleCards";
import AISection from "../components/AISection";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <main className="bg-white text-slate-900 overflow-x-hidden selection:bg-blue-600 selection:text-white">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <RoleCards />
      <AISection />
      <CTA />
      <Footer />
    </main>
  );
}

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import Tools from "@/components/sections/Tools";
import Process from "@/components/sections/Process";
import CTA from "@/components/sections/CTA";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <Process />
        <Tools />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

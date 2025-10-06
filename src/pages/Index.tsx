import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Education from "@/components/Education";
import Experience from "@/components/Experience";
import Work from "@/components/Work";
import Blog from "@/components/Blog";
import Contact from "@/components/Contact";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const Index = () => {
	
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo) {
      const sectionId = location.state.scrollTo;
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);
	
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <About />
      <Education />
      <Experience />
      <Work />
      <Blog />
      <Contact />
    </div>
  );
};

export default Index;

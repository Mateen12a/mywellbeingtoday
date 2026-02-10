import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/landing/Hero";
import Partners from "./components/landing/Partners";
import HowItWorks from "./components/landing/HowItWorks";
import FocusAreas from "./components/landing/FocusAreas";
import Features from "./components/landing/Features";
import Stats from "./components/landing/Stats";
import Testimonials from "./components/landing/Testimonials";
import CTA from "./components/landing/CTA";
import Footer from "./components/landing/Footer";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSessionVersion = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      try {
        const response = await fetch(`${API_URL}/api/auth/session-version`);
        const data = await response.json();
        const storedVersion = localStorage.getItem("sessionVersion");
        
        if (storedVersion && storedVersion !== data.version) {
          ["token", "user", "role", "sessionVersion"].forEach((k) => localStorage.removeItem(k));
          navigate("/login", { replace: true });
          return;
        }
        
        if (!storedVersion) {
          localStorage.setItem("sessionVersion", data.version);
        }
      } catch (err) {
        console.error("Session version check failed:", err);
      }
    };
    
    checkSessionVersion();
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.role?.toLowerCase().includes("admin")) {
          navigate("/dashboard/admin", { replace: true });
        } else if (user.role?.toLowerCase().includes("solution")) {
          navigate("/dashboard/sp", { replace: true });
        } else {
          navigate("/dashboard/to", { replace: true });
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (location.hash === '#how-it-works') {
      setTimeout(() => {
        const element = document.getElementById('how-it-works');
        if (element) {
          const navHeight = 80;
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: elementPosition - navHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <main>
        <Hero />
        {/* <Partners /> */}
        <HowItWorks />
        {/* <FocusAreas /> */}
        {/* <Features /> */}
        {/* <Stats /> */}
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default App;

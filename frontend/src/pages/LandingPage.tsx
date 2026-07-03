import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { Toaster } from "../components/ui";
import Navbar from "../components/landing/Navbar";
import HeroSection from "../components/landing/HeroSection";
import StatsSection from "../components/landing/StatsSection";
import ComoFuncionaSection from "../components/landing/ComoFuncionaSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import PlanesSection from "../components/landing/PlanesSection";
import TestimoniosSection from "../components/landing/TestimoniosSection";
import CTASection from "../components/landing/CTASection";
import ContactoSection from "../components/landing/ContactoSection";
import Footer from "../components/landing/Footer";

const RUTA_POR_ROL: Record<string, string> = {
  empresa: "/admin/dashboard",
  cliente: "/wallet",
  superadmin: "/superadmin",
  soporte: "/superadmin",
};

export default function LandingPage() {
  const { isAuthenticated, rol } = useAuth();
  const toast = useToast();

  useEffect(() => {
    document.documentElement.classList.add("scroll-smooth");
    return () => document.documentElement.classList.remove("scroll-smooth");
  }, []);

  if (isAuthenticated && rol) {
    return <Navigate to={RUTA_POR_ROL[rol] ?? "/login"} replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <ComoFuncionaSection />
      <FeaturesSection />
      <PlanesSection />
      <TestimoniosSection />
      <CTASection />
      <ContactoSection toast={toast} />
      <Footer />
      <Toaster toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const DesktopDashboard = dynamic(() => import("@/components/DesktopDashboard"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  ),
});

const MobileDashboard = dynamic(() => import("@/components/MobileDashboard"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  ),
});

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function DashboardPage() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileDashboard /> : <DesktopDashboard />;
}

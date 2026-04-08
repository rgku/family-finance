"use client";

import dynamic from "next/dynamic";

const DashboardContent = dynamic(() => import("./dashboard/DashboardContent"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  ),
});

export default function DashboardPage() {
  return <DashboardContent />;
}

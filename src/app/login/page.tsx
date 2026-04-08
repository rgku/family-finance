"use client";

import dynamic from "next/dynamic";

const LoginContent = dynamic(() => import("./LoginContent"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  ),
});

export default function LoginPage() {
  return <LoginContent />;
}

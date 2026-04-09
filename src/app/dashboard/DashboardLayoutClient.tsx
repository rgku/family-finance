"use client";

// TODO: Auth will be implemented when moving to production mode
// Currently not used - app runs in demo mode

import { AuthProvider } from "@/contexts/AuthContext";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

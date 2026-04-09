"use client";

// AuthProvider will be implemented for production mode
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

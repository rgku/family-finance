import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Finance - Gestão de Gastos Familiares",
  description: "Aplicação de gestão de gastos familiares com visualização em tempo real",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-900 text-white">{children}</body>
    </html>
  );
}

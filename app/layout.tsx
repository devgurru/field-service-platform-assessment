import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fieldnotes | React + Supabase Assessment",
  description:
    "Original technical evaluation: role-restricted payroll exports, Supabase RLS and a modular field-service architecture. Synthetic data only.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

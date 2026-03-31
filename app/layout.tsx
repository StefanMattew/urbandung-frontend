import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar"; 
import { Suspense } from 'react';
export const metadata: Metadata = {
  title: "UrBandung | Eksplor Bandung",
  description: "Eksplor berbagai tempat menarik di Bandung.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-[#F8F9FA] text-gray-900 antialiased">
        <Suspense fallback={<div>Memuat navigasi...</div>}>
          <Navbar />
        </Suspense>
        
        <main>{children}</main>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Lora, Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LiturgicalThemeProvider } from "@/components/LiturgicalThemeProvider";
import { Navbar } from "@/components/Navbar";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cifras Litúrgicas",
  description: "Cifras de músicas de missa e terço",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${outfit.variable} ${lora.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f4f0e6] text-gray-900">
        <LiturgicalThemeProvider>
          <Navbar />
          <div className="flex-1">
            {children}
          </div>
          <footer className="print:hidden border-t border-gray-250/20 py-6 text-center text-xs text-gray-500 font-sans mt-auto">
            <p className="font-serif italic text-gray-600 mb-1">Paróquia de Santo Antônio</p>
            <p className="uppercase tracking-widest text-[9px] text-gray-400 font-semibold">Antônio Martins • RN</p>
          </footer>
        </LiturgicalThemeProvider>
      </body>
    </html>
  );
}

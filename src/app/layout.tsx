import type { Metadata } from "next";
import { Lora, Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LiturgicalThemeProvider } from "@/components/LiturgicalThemeProvider";
import { Navbar } from "@/components/Navbar";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import Link from "next/link";

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
  metadataBase: new URL("https://cifras-liturgicas-cms.web.app"),
  title: {
    default: "Cifras Litúrgicas - Paróquia de Santo Antônio",
    template: "%s | Cifras Litúrgicas",
  },
  description: "Cifras de músicas de missa e terço da Paróquia de Santo Antônio, Antônio Martins - RN.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo-principal.png",
  },
  openGraph: {
    title: "Cifras Litúrgicas - Paróquia de Santo Antônio",
    description: "Cifras de músicas de missa e terço da Paróquia de Santo Antônio, Antônio Martins - RN.",
    url: "https://cifras-liturgicas-cms.web.app",
    siteName: "Cifras Litúrgicas",
    images: [
      {
        url: "/logo-principal.png",
        width: 512,
        height: 512,
        alt: "Logo Cifras Litúrgicas",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Cifras Litúrgicas - Paróquia de Santo Antônio",
    description: "Cifras de músicas de missa e terço da Paróquia de Santo Antônio, Antônio Martins - RN.",
    images: ["/logo-principal.png"],
  },
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
          <ServiceWorkerRegister />
          <Navbar />
          <div className="flex-1">
            {children}
          </div>
          <footer className="print:hidden border-t border-gray-250/20 py-6 text-center text-xs text-gray-500 font-sans mt-auto">
            <Link 
              href="/admin/dashboard" 
              className="font-serif italic text-gray-600 mb-1 hover:text-primary-750 transition-colors block select-none"
            >
              Paróquia de Santo Antônio
            </Link>
            <p className="uppercase tracking-widest text-[9px] text-gray-400 font-semibold">Antônio Martins • RN</p>
          </footer>
        </LiturgicalThemeProvider>
      </body>
    </html>
  );
}

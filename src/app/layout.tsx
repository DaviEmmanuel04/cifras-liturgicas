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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var savedColor = localStorage.getItem('liturgical-theme-active-color');
                if (savedColor) {
                  var colorPalettes = {
                    green: { '50': '#f2f6f1', '100': '#e1ebe0', '200': '#c4d6c2', '300': '#9ebaa0', '400': '#739b78', '500': '#527e59', '600': '#3d6443', '700': '#325037', '800': '#263e2a', '900': '#1e3021' },
                    violet: { '50': '#f8f2fc', '100': '#efe1fa', '200': '#e0c7f5', '300': '#caa0eb', '400': '#ac6ede', '500': '#8f46c6', '600': '#722d9f', '700': '#5a217f', '800': '#481b65', '900': '#35124b' },
                    red: { '50': '#fdf2f2', '100': '#fbe3e3', '200': '#f8cdcd', '300': '#f2a7a7', '400': '#e77777', '500': '#d44c4c', '600': '#b02b2b', '700': '#901e1e', '800': '#731818', '900': '#5c1313' },
                    white: { '50': '#fbf9f2', '100': '#f4eecf', '200': '#ebd99f', '300': '#dfbe68', '400': '#cca03f', '500': '#b3832c', '600': '#956821', '700': '#78511a', '800': '#604015', '900': '#4c3210' },
                    rose: { '50': '#fdf5f6', '100': '#fbe6eb', '200': '#f6c4cd', '300': '#ee9ba9', '400': '#e06b80', '500': '#cc4a64', '600': '#a83149', '700': '#8a253a', '800': '#6f1e2e', '900': '#581724' },
                    black: { '50': '#f5f5f5', '100': '#e9e9e9', '200': '#d4d4d4', '300': '#b5b5b5', '400': '#8f8f8f', '500': '#6c6c6c', '600': '#4f4f4f', '700': '#3b3b3b', '800': '#2b2b2b', '900': '#1f1f1f' },
                    blue: { '50': '#f0f5fa', '100': '#ddebf5', '200': '#c0d9ed', '300': '#97bfdd', '400': '#659bc8', '500': '#467ead', '600': '#34628a', '700': '#2b5071', '800': '#23415c', '900': '#1b3247' }
                  };
                  var palette = colorPalettes[savedColor];
                  if (palette) {
                    var root = document.documentElement;
                    for (var shade in palette) {
                      root.style.setProperty('--primary-' + shade, palette[shade]);
                    }
                  }
                }
              } catch (e) {}
            `
          }}
        />
      </head>
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

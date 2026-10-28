import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FinanceCreateProvider } from "@/hooks/useFinanceCreate"

import { Providers } from "@/components/providers";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://projeto-de-tcc-caua.vercel.app";
const description = "Sistema de controle financeiro pessoal e familiar";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Projeto de TCC",
  description,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Projeto de TCC",
    title: "Projeto de TCC",
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 627,
        alt: "Projeto de TCC — sistema de controle financeiro pessoal e familiar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Projeto de TCC",
    description,
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-lt-installed="true" suppressHydrationWarning>
      <body>
        <Providers>
          <FinanceCreateProvider>
            {children}
          </FinanceCreateProvider>
        </Providers>
      </body>
    </html>
  );
}
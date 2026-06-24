import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio — Gestão de Salão",
  description: "Sistema de gestão para salões de beleza e barbearias",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full">
        {children}
        {/* nonce repassado ao Next.js para carimbar scripts de hidratação */}
        {nonce && <Script id="__nonce" nonce={nonce} strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: "" }} />}
      </body>
    </html>
  );
}

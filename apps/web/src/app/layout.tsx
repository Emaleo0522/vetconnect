import type { Metadata } from "next";
import { Fraunces, Source_Serif_4, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Display / heading: Fraunces italic variable (opsz para expresividad editorial)
// axes requiere weight:"variable" — no puede combinarse con array de weights estáticos
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "swap",
});

// Body serif: Source Serif 4 (legibilidad editorial)
const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// UI utility: Inter (formularios, tablas, labels — NO headings)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VetConnect Global — Plataforma Veterinaria Integral",
    template: "%s | VetConnect Global",
  },
  description:
    "Cuidamos juntos, conectamos vidas. Plataforma veterinaria para duenos de mascotas, veterinarios y organizaciones de rescate animal. Historial medico, cartilla vacunatoria digital, directorio de veterinarios y mas.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "VetConnect Global",
    title: "VetConnect Global — Plataforma Veterinaria Integral",
    description:
      "Conectamos duenos de mascotas, veterinarios y organizaciones de rescate animal. Historial medico digital, vacunas, QR de identificacion y mas.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VetConnect Global — Cuidamos juntos, conectamos vidas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VetConnect Global — Plataforma Veterinaria Integral",
    description:
      "Conectamos duenos de mascotas, veterinarios y organizaciones de rescate animal.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      dir="ltr"
      className={`${fraunces.variable} ${sourceSerif4.variable} ${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#1F3C2E" />
        {/* Preconnect al API backend */}
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_API_URL ?? "https://vc-api.161-153-203-83.sslip.io"}
        />
        <link
          rel="dns-prefetch"
          href={process.env.NEXT_PUBLIC_API_URL ?? "https://vc-api.161-153-203-83.sslip.io"}
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="prefetch" href="/dashboard/pets" />
        <link rel="prefetch" href="/dashboard/vets" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "VetConnect Global",
              description:
                "Plataforma veterinaria integral que conecta duenos de mascotas, veterinarios y organizaciones de rescate animal.",
              url: "https://vetconnect-global.netlify.app",
              applicationCategory: "HealthApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "ARS",
              },
              featureList: [
                "Gestion de mascotas",
                "Cartilla vacunatoria digital",
                "QR de identificacion",
                "Directorio de veterinarios",
                "Resenas verificadas",
                "Mapa interactivo",
                "Notificaciones de vacunas",
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        <noscript>
          Este sitio requiere JavaScript para funcionar correctamente.
        </noscript>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:rounded"
        >
          Saltar al contenido
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

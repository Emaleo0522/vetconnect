import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["700", "800"],
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
        url: "/images/hero.jpg",
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
    images: ["/images/hero.jpg"],
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
      className={`${inter.variable} ${plusJakarta.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta name="theme-color" content="#2b7a9e" />
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}
        />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "VetConnect Global",
              description:
                "Plataforma veterinaria integral que conecta duenos de mascotas, veterinarios y organizaciones de rescate animal.",
              url: "https://vetconnect.netlify.app",
              applicationCategory: "HealthApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
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
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <noscript>
          Este sitio requiere JavaScript para funcionar correctamente.
        </noscript>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Saltar al contenido
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

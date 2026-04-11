"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { PawPrint, Stethoscope, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <main id="main-content" className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <div className="flex items-center gap-3">
          <PawPrint className="h-10 w-10 text-primary" strokeWidth={2.5} />
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            VetConnect Global
          </h1>
        </div>
        <p className="max-w-xl text-lg text-muted-foreground">
          Cuidamos juntos, conectamos vidas. La plataforma que une a duenos de
          mascotas, veterinarios y organizaciones de rescate animal.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            Iniciar sesion
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }), "gap-2")}
          >
            Crear cuenta
          </Link>
        </div>

        {/* Feature cards */}
        <div className="mt-12 grid w-full max-w-3xl gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<PawPrint className="h-8 w-8 text-primary" />}
            title="Tus mascotas"
            description="Historial medico, vacunas y QR de identificacion en un solo lugar."
          />
          <FeatureCard
            icon={<Stethoscope className="h-8 w-8 text-secondary" />}
            title="Veterinarios"
            description="Encuentra profesionales cerca de ti con resenas verificadas."
          />
          <FeatureCard
            icon={<Heart className="h-8 w-8 text-destructive" />}
            title="Rescate animal"
            description="Conecta con organizaciones que cuidan animales en situacion de calle."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} VetConnect Global. Todos los
        derechos reservados.
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 shadow-sm">
      {icon}
      <h3 className="font-heading text-lg font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

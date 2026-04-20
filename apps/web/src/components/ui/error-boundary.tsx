"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary reutilizable para módulos del dashboard.
 * Muestra fallback editorial en lugar de pantalla blanca.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="flex flex-col items-center gap-4 rounded-md py-12 text-center"
          style={{ border: "1px solid var(--border)", background: "var(--cream-25)" }}
          role="alert"
        >
          <AlertTriangle
            className="h-8 w-8"
            style={{ color: "var(--terracotta-500)" }}
            aria-hidden="true"
          />
          <div>
            <p
              className="font-medium italic"
              style={{ fontFamily: "var(--font-fraunces)", color: "var(--warm-700)", fontSize: "1.0625rem" }}
            >
              Algo salió mal
            </p>
            <p
              className="mt-1 text-sm"
              style={{ fontFamily: "var(--font-inter)", color: "var(--warm-400)" }}
            >
              Ocurrió un error al cargar esta sección.
            </p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            style={{
              background: "var(--forest-900)",
              color: "var(--cream-50)",
              fontFamily: "var(--font-inter)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

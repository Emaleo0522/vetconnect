"use client";

import { useAuthStore } from "@/lib/auth";
import { OwnerDashboard } from "@/components/dashboard/owner-dashboard";
import { VetDashboard } from "@/components/dashboard/vet-dashboard";
import { OrgDashboard } from "@/components/dashboard/org-dashboard";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "owner";

  if (role === "vet") return <VetDashboard />;
  if (role === "org") return <OrgDashboard />;
  return <OwnerDashboard />;
}

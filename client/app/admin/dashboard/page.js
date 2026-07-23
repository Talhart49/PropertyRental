"use client";

import { useAuth } from "../../providers";
import ProtectedPage from "../../../components/ProtectedPage";
import DashboardShell from "../../../components/DashboardShell";
import PageLoader from "../../../components/PageLoader";
import AdminDashboard from "../../../components/AdminDashboard";

export default function AdminDashboardPage() {
  const { isReady } = useAuth();

  if (!isReady) {
    return <PageLoader />;
  }

  return (
    <ProtectedPage allowedRole="admin">
      <DashboardShell
        badge="Dashboard"
        description="High-level overview of platform activity and key metrics."
        title="Dashboard"
      >
        <AdminDashboard />
      </DashboardShell>
    </ProtectedPage>
  );
}
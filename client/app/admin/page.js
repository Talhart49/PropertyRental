"use client";

import ProtectedPage from "../../components/ProtectedPage";
import DashboardShell from "../../components/DashboardShell";
import AdminManagement from "../../components/AdminManagement";

export default function AdminDashboardPage() {
  return (
    <ProtectedPage allowedRole="admin">
      <DashboardShell
        badge="Management Hub"
        description="Moderate listings, manage users, broadcast notifications, and review platform activity."
        title="Admin management"
      >
        <AdminManagement />
      </DashboardShell>
    </ProtectedPage>
  );
}
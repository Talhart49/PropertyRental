import ProtectedPage from "../../../components/ProtectedPage";
import DashboardShell from "../../../components/DashboardShell";
import TenantSearch from "../../../components/TenantSearch";

export default function TenantSearchPage() {
  return (
    <ProtectedPage allowedRole="tenant">
      <DashboardShell
        badge="Search Properties"
        description="Search available listings, apply filters, and open full property details."
        title="Search properties"
      >
        <TenantSearch />
      </DashboardShell>
    </ProtectedPage>
  );
}
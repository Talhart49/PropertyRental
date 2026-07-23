import ProtectedPage from "../../../components/ProtectedPage";
import DashboardShell from "../../../components/DashboardShell";
import LandlordListings from "../../../components/LandlordListings";

export default function LandlordListingsPage() {
  return (
    <ProtectedPage allowedRole="landlord">
      <DashboardShell
        badge="My Listings"
        description="Create, edit, and manage property listings directly from your landlord workspace."
        title="My listings"
      >
        <LandlordListings />
      </DashboardShell>
    </ProtectedPage>
  );
}
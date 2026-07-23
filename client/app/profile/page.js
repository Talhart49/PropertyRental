import ProtectedPage from "../../components/ProtectedPage";
import DashboardShell from "../../components/DashboardShell";
import ProfileForm from "../../components/ProfileForm";

export default function ProfilePage() {
  return (
    <ProtectedPage>
      <DashboardShell badge="Profile" title="Profile" description="Manage your account details, password, and personal data.">
        <ProfileForm />
      </DashboardShell>
    </ProtectedPage>
  );
}

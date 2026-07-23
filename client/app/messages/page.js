import ProtectedPage from "../../components/ProtectedPage";
import DashboardShell from "../../components/DashboardShell";
import ConversationsInbox from "../../components/ConversationsInbox";

export default function MessagesPage() {
  return (
    <ProtectedPage>
      <DashboardShell
        badge="Messages"
        title="Messages"
        description="Review and respond to conversations with tenants and landlords."
      >
        <ConversationsInbox />
      </DashboardShell>
    </ProtectedPage>
  );
}
import { DashboardShell } from "@/components/dashboard-shell";
import { getUserProfile } from "@/lib/get-profile";
import { ActivityClient } from "./activity-client";

export default async function RiwayatActivityPage() {
  const { email, fullName, role } = await getUserProfile();

  return (
    <DashboardShell userEmail={email} userName={fullName} userRole={role}>
      <ActivityClient />
    </DashboardShell>
  );
}

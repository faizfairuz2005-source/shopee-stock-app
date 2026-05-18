import { DashboardShell } from "@/components/dashboard-shell";
import { getUserProfile } from "@/lib/get-profile";
import { PelangganClient } from "./pelanggan-client";
import { getCustomers } from "./actions";

export default async function PelangganPage() {
  const { email, fullName, role } = await getUserProfile();
  const result = await getCustomers();

  return (
    <DashboardShell userEmail={email} userName={fullName} userRole={role}>
      <PelangganClient initialCustomers={result.customers} />
    </DashboardShell>
  );
}

import { DashboardShell } from "@/components/dashboard-shell";
import { getUserProfile } from "@/lib/get-profile";
import { SupplierClient } from "./supplier-client";
import { getSuppliers } from "@/app/actions";

export default async function SupplierPage() {
  const { email, fullName, role } = await getUserProfile();
  const suppliers = await getSuppliers();

  return (
    <DashboardShell userEmail={email} userName={fullName} userRole={role}>
      <SupplierClient initialSuppliers={suppliers} />
    </DashboardShell>
  );
}

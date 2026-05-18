import { DashboardShell } from "@/components/dashboard-shell";
import { getUserProfile } from "@/lib/get-profile";
import { BarangMasukNav } from "./nav";

export default async function BarangMasukLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { email, fullName, role } = await getUserProfile();

  return (
    <DashboardShell userEmail={email} userName={fullName} userRole={role}>
      <BarangMasukNav />
      {children}
    </DashboardShell>
  );
}

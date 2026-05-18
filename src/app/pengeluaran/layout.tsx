import { DashboardShell } from "@/components/dashboard-shell";
import { getUserProfile } from "@/lib/get-profile";

export default async function PengeluaranLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { email, fullName, role } = await getUserProfile();

  return (
    <DashboardShell userEmail={email} userName={fullName} userRole={role}>
      {children}
    </DashboardShell>
  );
}

import { DashboardShell } from "@/components/dashboard-shell";
import { getUserProfile } from "@/lib/get-profile";

export default async function ReturLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { email, fullName, role, avatarUrl } = await getUserProfile();

  return (
    <DashboardShell userEmail={email} userName={fullName} userRole={role} userAvatarUrl={avatarUrl}>
      {children}
    </DashboardShell>
  );
}

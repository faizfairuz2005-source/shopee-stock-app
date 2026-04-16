import { DashboardShell } from "@/components/dashboard-shell";
import { createClient } from "@/lib/supabase/server";

export default async function ConnectShopeeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Note: Auth protection is now handled by middleware
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <DashboardShell userEmail={user?.email ?? ""} userName={fullName}>
      {children}
    </DashboardShell>
  );
}

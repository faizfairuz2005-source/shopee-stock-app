import { redirect } from "next/navigation"

import { SettingsContent } from "@/components/settings/settings-content"
import { DashboardShell } from "@/components/dashboard-shell"
import { createClient } from "@/lib/supabase/server"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? ""
  const phone = (user.user_metadata?.phone as string | undefined) ?? ""

  return (
    <DashboardShell userEmail={user.email ?? ""} userName={fullName}>
      <SettingsContent
        initialFullName={fullName}
        initialEmail={user.email ?? ""}
        initialPhone={phone}
      />
    </DashboardShell>
  )
}

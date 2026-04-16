import { SettingsContent } from "@/components/settings/settings-content"
import { createClient } from "@/lib/supabase/server"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Note: Auth protection is now handled by middleware
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? ""
  const phone = (user?.user_metadata?.phone as string | undefined) ?? ""

  return (
    <SettingsContent
      initialFullName={fullName}
      initialEmail={user?.email ?? ""}
      initialPhone={phone}
    />
  )
}

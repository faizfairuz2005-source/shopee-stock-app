import { SettingsContent } from "@/components/settings/settings-content"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { getUserProfile } from "@/lib/get-profile"

export default async function SettingsPage() {
  const { email, fullName, role } = await getUserProfile()
  const phone = ""

  return (
    <div className="space-y-6 page-enter">
      <Breadcrumb
        segments={[
          { name: "Dashboard", href: "/dashboard" },
          { name: "Settings", href: "/settings" },
        ]}
        className="mb-2"
      />
      <SettingsContent
        initialFullName={fullName}
        initialEmail={email}
        initialPhone={phone}
        userRole={role}
      />
    </div>
  )
}

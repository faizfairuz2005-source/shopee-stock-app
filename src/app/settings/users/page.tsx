import { requireRole } from "@/lib/auth"
import { UserManagementClient } from "./user-management-client"
import { getUsers } from "./actions"

export default async function UsersPage() {
  await requireRole(["Admin"])
  const users = await getUsers()

  return (
    <UserManagementClient initialUsers={users} />
  )
}

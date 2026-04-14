import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes, LayoutDashboard, Link2, ShoppingCart, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

import { signOutAction } from "./actions";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900">
      <aside className="w-64 border-r border-blue-200/50 bg-gradient-to-b from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-950/50 p-5 shadow-lg">
        <div className="mb-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shadow-lg">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-white" />
            <div>
              <p className="text-base font-semibold tracking-tight text-white">Shopee Stock</p>
              <p className="text-xs font-normal text-blue-100/80">Admin Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          <Link
            href="/dashboard"
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-blue-900 transition-all hover:bg-blue-100/70"
          >
            <LayoutDashboard className="h-4 w-4 transition-colors group-hover:text-blue-600" />
            Dashboard
          </Link>
          <Link
            href="/connect-shopee"
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-all hover:bg-blue-100/70 hover:text-blue-900"
          >
            <Link2 className="h-4 w-4 transition-colors group-hover:text-blue-600" />
            Hubungkan Shopee
          </Link>
          <Link
            href="/inventory"
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-all hover:bg-blue-100/70 hover:text-blue-900"
          >
            <Boxes className="h-4 w-4 transition-colors group-hover:text-blue-600" />
            Inventory
          </Link>
          <Link
            href="/orders"
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition-all hover:bg-blue-100/70 hover:text-blue-900"
          >
            <ShoppingCart className="h-4 w-4 transition-colors group-hover:text-blue-600" />
            Orders
          </Link>
        </nav>

        <div className="absolute bottom-5 left-5 right-5 mt-8 space-y-2">
          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/50">
            <p className="truncate text-xs font-medium text-blue-900 dark:text-blue-100">{user.email}</p>
          </div>
          <form action={signOutAction}>
            <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-900 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950">
              Logout
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}

import Link from "next/link";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Link2,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { signOutAction } from "@/app/dashboard/actions";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/connect-shopee", icon: Link2, label: "Hubungkan Shopee" },
  { href: "/inventory", icon: Boxes, label: "Inventory" },
  { href: "/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/laporan", icon: BarChart3, label: "Laporan" },
];

interface SidebarProps {
  activePath: string;
  userEmail: string;
  userName?: string;
}

export function Sidebar({ activePath, userEmail, userName }: SidebarProps) {
  const displayName = userName?.trim() || userEmail;
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar transition-colors duration-200 ease-out">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <div className="group/logo flex h-8 w-8 items-center justify-center rounded-lg bg-primary transition-[transform,box-shadow] duration-200 ease-out hover:scale-105 hover:shadow-md">
          <Package className="h-4 w-4 text-primary-foreground transition-transform duration-200 ease-out group-hover/logo:scale-110" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-foreground">
            MultiStock
          </p>
          <p className="text-[0.65rem] font-normal text-muted-foreground">
            Inventory Manager
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = activePath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group/nav flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-[background-color,color,transform] duration-200 ease-out active:scale-[0.99] ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 ease-out group-hover/nav:scale-110 group-active/nav:scale-100" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3">
        <Separator />
      </div>

      {/* Bottom */}
      <div className="space-y-1 px-3 py-4">
        <div className="rounded-lg border border-border px-3 py-2.5 transition-[border-color,box-shadow] duration-200 ease-out hover:border-sidebar-ring/30 hover:shadow-sm">
          <p className="truncate text-xs font-medium text-sidebar-foreground">
            {displayName}
          </p>
          <p className="truncate text-[0.65rem] text-muted-foreground">
            {userEmail}
          </p>
        </div>
        <Link
          href="/settings"
          className="group/settings flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-[background-color,color,transform] duration-200 ease-out hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground active:scale-[0.99]"
        >
          <Settings className="h-4 w-4 shrink-0 transition-transform duration-200 ease-out group-hover/settings:rotate-12 group-hover/settings:scale-110 group-active/settings:scale-100" />
          Settings
        </Link>
        <form action={signOutAction}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 font-normal text-sidebar-foreground hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0 transition-transform duration-200 ease-in-out group-hover/button:scale-110" />
            Logout
          </Button>
        </form>
      </div>
    </aside>
  );
}

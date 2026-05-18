"use client";

import { useContext } from "react";
import Link from "next/link";
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Receipt,
  PackageOpen,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signOutAction } from "@/app/dashboard/actions";
import { DashboardRoleContext } from "@/components/dashboard-shell";
import { hasPermission, type Permission } from "@/lib/permissions";
import { RoleBadge } from "@/components/role-badge";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  permission: Permission;
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", permission: "dashboard.view" },
  { href: "/pos", icon: Receipt, label: "Kasir", permission: "pos.access" },
  { href: "/inventory", icon: Boxes, label: "Inventory", permission: "inventory.view" },
  { href: "/orders", icon: ShoppingCart, label: "Orders", permission: "orders.view" },
  { href: "/pelanggan", icon: Users, label: "Pelanggan", permission: "customers.view" },
  { href: "/barang-masuk", icon: PackageOpen, label: "Barang Masuk", permission: "barang-masuk.view" },
  { href: "/laporan", icon: BarChart3, label: "Laporan", permission: "laporan.view" },
  { href: "/connect-shopee", icon: Link2, label: "Hubungkan Shopee", permission: "connect-shopee" },
];

interface SidebarProps {
  activePath: string;
  userEmail: string;
  userName?: string;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ activePath, userEmail, userName, collapsed, onToggle }: SidebarProps) {
  const role = useContext(DashboardRoleContext);
  const displayName = userName?.trim() || userEmail;
  const width = collapsed ? "w-16" : "w-64";

  const visibleItems = navItems.filter((item) => hasPermission(role, item.permission));

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-sidebar transition-[width,background-color] duration-300 ease-out ${width}`}>
      {/* Logo & Toggle — always visible */}
      <div className={`flex h-16 items-center border-b border-border ${collapsed ? "justify-center px-2" : "gap-2.5 px-5"}`}>
        <div className="group/logo flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Package className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              MultiStock
            </p>
            <p className="text-[0.65rem] font-normal text-muted-foreground">
              Inventory Manager
            </p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="shrink-0 rounded-md p-1.5 hover:bg-sidebar-accent/50 transition-colors"
          aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
          title={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Navigation — items filtered by role */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleItems.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <Menu className="mx-auto h-5 w-5 text-muted-foreground/40" />
            {!collapsed && (
              <p className="mt-2 text-xs text-muted-foreground/50">
                Tidak ada menu tersedia
              </p>
            )}
          </div>
        ) : (
          visibleItems.map((item) => {
            const isActive = activePath === item.href || activePath.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`group/nav flex items-center rounded-lg px-3 py-2 text-sm font-medium outline-none transition-[background-color,color] duration-150 ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground"
                } ${collapsed ? "justify-center" : "gap-3"}`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="overflow-hidden">{item.label}</span>}
              </Link>
            );
          })
        )}
      </nav>

      <div className="px-3">
        <Separator />
      </div>

      {/* Bottom: user info, settings, logout */}
      <div className={`space-y-1 py-4 ${collapsed ? "px-2" : "px-3"}`}>
        {!collapsed && (
          <div className="rounded-lg border border-border px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {displayName}
              </p>
              {role && <RoleBadge role={role} />}
            </div>
            <p className="truncate text-[0.65rem] text-muted-foreground mt-0.5">
              {userEmail}
            </p>
          </div>
        )}
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={`group/settings flex items-center rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-[background-color,color] duration-150 hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground ${collapsed ? "justify-center" : "gap-3"}`}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && "Settings"}
        </Link>
        <form action={signOutAction}>
          <Button
            variant="ghost"
            title={collapsed ? "Logout" : undefined}
            className={`w-full text-sidebar-foreground hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground ${collapsed ? "justify-center px-2" : "justify-start gap-3"}`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && "Logout"}
          </Button>
        </form>
      </div>
    </aside>
  );
}

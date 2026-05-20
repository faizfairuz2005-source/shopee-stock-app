"use client";

import { useState, useEffect, useCallback, useContext } from "react";
import { Bell, Check, ChevronDown, LogOut, Loader2, PackageOpen, AlertTriangle } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleBadge } from "@/components/role-badge";
import { useLogout } from "@/hooks/use-logout";
import { getAppData } from "@/app/actions";
import { DashboardRoleContext } from "@/components/dashboard-shell";

interface StockAlert {
  sku: string;
  name: string;
  stock: number;
  type: "habis" | "rendah";
}

interface HeaderProps {
  userEmail: string;
  userName?: string;
}

export function Header({ userEmail, userName }: HeaderProps) {
  const role = useContext(DashboardRoleContext);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const displayName = userName?.trim() || userEmail;
  const initials = displayName.substring(0, 2).toUpperCase();
  const { logout, isLoading } = useLogout();

  // Fetch real stock data
  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoadingAlerts(true);
      const data = await getAppData();
      const low: StockAlert[] = data.inventoryProducts
        .filter((p) => p.totalStock === 0)
        .map((p) => ({ sku: p.sku, name: p.name, stock: p.totalStock, type: "habis" as const }));
      const lowStock: StockAlert[] = data.inventoryProducts
        .filter((p) => p.totalStock > 0 && p.totalStock <= (p.minStok ?? 10))
        .map((p) => ({ sku: p.sku, name: p.name, stock: p.totalStock, type: "rendah" as const }));
      setAlerts([...low, ...lowStock]);
    } catch (e) {
      console.error("Failed to fetch stock alerts", e);
    } finally {
      setIsLoadingAlerts(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    // Refresh every 60 seconds
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.sku));
  const unreadCount = visibleAlerts.length;

  const handleDismiss = (sku: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(sku));
  };

  const handleDismissAll = () => {
    setDismissedAlerts(new Set(alerts.map((a) => a.sku)));
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6 shadow-sm">
      <div className="flex items-center gap-3">
        {role && <RoleBadge role={role} />}
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
            <Bell className="h-4 w-4 transition-transform duration-200 ease-in-out hover:scale-110" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[0.6rem] font-bold text-white animate-in zoom-in">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm font-semibold">
                {unreadCount > 0 ? `${unreadCount} Alert Stok` : "Notifikasi Stok"}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleDismissAll}
                  className="rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Abaikan semua
                </button>
              )}
            </div>
            <DropdownMenuSeparator />

            {isLoadingAlerts ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Loader2 className="mb-2 h-8 w-8 animate-spin text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Memuat data stok...</p>
              </div>
            ) : visibleAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <PackageOpen className="mb-2 h-8 w-8 text-emerald-400/60" />
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Semua stok aman!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tidak ada produk yang perlu perhatian
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs text-muted-foreground">
                    {alerts.filter((a) => a.type === "habis").length} habis • {alerts.filter((a) => a.type === "rendah").length} rendah
                  </p>
                </div>
                {visibleAlerts.map((alert) => (
                  <div
                    key={alert.sku}
                    className={`border-b border-border p-3 transition-colors duration-200 hover:bg-muted/50 ${
                      alert.type === "habis" ? "bg-destructive/5" : "bg-amber-50/50 dark:bg-amber-950/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          alert.type === "habis"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                        }`}
                      >
                        <AlertTriangle className="h-3 w-3" />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <p className={`text-sm font-medium leading-snug ${alert.type === "habis" ? "text-destructive" : "text-amber-700 dark:text-amber-300"}`}>
                          {alert.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {alert.type === "habis" ? "Stok sudah habis" : `Hanya tersisa ${alert.stock} unit`}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDismiss(alert.sku);
                        }}
                        className="shrink-0 rounded p-0.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                        title="Abaikan"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="group/menu flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-[background-color,transform] duration-200 ease-out hover:bg-accent active:scale-[0.98]">
            <Avatar className="h-7 w-7 transition-transform duration-200 ease-out group-hover/menu:scale-105">
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-40 truncate">{displayName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ease-out group-hover/menu:translate-y-0.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">Account</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                  {role && (
                    <div className="mt-1">
                      <RoleBadge role={role} />
                    </div>
                  )}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} disabled={isLoading} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Logging out...' : 'Logout'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

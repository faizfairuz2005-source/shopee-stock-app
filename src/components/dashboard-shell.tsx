"use client";

import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { type Role } from "@/lib/permissions";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export const DashboardRoleContext = createContext<Role | null>(null);

type DashboardProfileContextValue = {
  displayName: string;
  email: string;
  avatarUrl: string;
  setDisplayName: (name: string) => void;
  setAvatarUrl: (url: string) => void;
};

const DashboardProfileContext = createContext<DashboardProfileContextValue | null>(null);

export function useDashboardProfile() {
  const context = useContext(DashboardProfileContext);
  if (!context) {
    throw new Error("useDashboardProfile must be used within DashboardShell");
  }
  return context;
}

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  } catch {
    return false;
  }
}

export function DashboardShell({
  children,
  userEmail,
  userName,
  userRole,
  userAvatarUrl,
}: Readonly<{ children: React.ReactNode; userEmail: string; userName?: string; userRole?: Role | null; userAvatarUrl?: string }>) {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState(userName?.trim() || userEmail);
  const [avatarUrl, setAvatarUrl] = useState(userAvatarUrl || "");
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar-collapsed", JSON.stringify(next));
      } catch { /* noop */ }
      return next;
    });
  }, []);

  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      displayName,
      email: userEmail,
      avatarUrl,
      setDisplayName,
      setAvatarUrl,
    }),
    [displayName, userEmail, avatarUrl]
  );

  const mainMargin = collapsed ? "pl-0 lg:pl-16" : "pl-0 lg:pl-64";

  return (
    <DashboardRoleContext.Provider value={userRole ?? null}>
      <DashboardProfileContext.Provider value={contextValue}>
        <div className="min-h-screen bg-background">
          {/* Mobile: Sheet (drawer) - visible only on screens below lg */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent side="left" className="w-72 p-0">
              <Sidebar
                variant="drawer"
                activePath={pathname}
                userEmail={userEmail}
                userName={displayName}
                collapsed={false}
                onToggle={handleMobileMenuClose}
                onNavigate={handleMobileMenuClose}
              />
            </SheetContent>
          </Sheet>

          {/* Desktop: Fixed sidebar - hidden below lg */}
          <Sidebar
            activePath={pathname}
            userEmail={userEmail}
            userName={displayName}
            collapsed={collapsed}
            onToggle={handleToggle}
          />
          <div className={`flex flex-col transition-[padding] duration-300 ease-out ${mainMargin}`}>
            <Header
              userEmail={userEmail}
              userName={displayName}
              avatarUrl={avatarUrl}
              onMenuClick={handleMobileMenuToggle}
            />
            <main className="flex-1">
              <div className="mx-auto w-full max-w-[1280px] px-6 py-6 sm:px-8 sm:py-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </DashboardProfileContext.Provider>
    </DashboardRoleContext.Provider>
  );
}

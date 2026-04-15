"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";

type DashboardProfileContextValue = {
  displayName: string;
  email: string;
  setDisplayName: (name: string) => void;
};

const DashboardProfileContext = createContext<DashboardProfileContextValue | null>(null);

export function useDashboardProfile() {
  const context = useContext(DashboardProfileContext);
  if (!context) {
    throw new Error("useDashboardProfile must be used within DashboardShell");
  }
  return context;
}

export function DashboardShell({
  children,
  userEmail,
  userName,
}: Readonly<{ children: React.ReactNode; userEmail: string; userName?: string }>) {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState(userName?.trim() || userEmail);

  const contextValue = useMemo(
    () => ({
      displayName,
      email: userEmail,
      setDisplayName,
    }),
    [displayName, userEmail]
  );

  return (
    <DashboardProfileContext.Provider value={contextValue}>
      <div className="min-h-screen bg-background">
        <Sidebar activePath={pathname} userEmail={userEmail} userName={displayName} />
        <div className="pl-64">
          <Header userEmail={userEmail} userName={displayName} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </DashboardProfileContext.Provider>
  );
}

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
        <div className="flex flex-col pl-64">
          <Header userEmail={userEmail} userName={displayName} />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1280px] px-6 py-6 sm:px-8 sm:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardProfileContext.Provider>
  );
}

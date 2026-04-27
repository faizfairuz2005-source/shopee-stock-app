"use client";

import { useState } from "react";
import { Bell, Check, ChevronDown, LogOut, Loader2 } from "lucide-react";

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
import { useLogout } from "@/hooks/use-logout";

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: "info" | "success" | "warning" | "alert";
}

const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    message: "Stok Kaos Hitam rendah (3 toko)",
    timestamp: "5 menit lalu",
    isRead: false,
    type: "warning",
  },
  {
    id: "notif-2",
    message: "Pesanan baru dari Toko Shopee A",
    timestamp: "15 menit lalu",
    isRead: false,
    type: "alert",
  },
  {
    id: "notif-3",
    message: "Sinkronisasi stok berhasil",
    timestamp: "2 jam lalu",
    isRead: false,
    type: "success",
  },
  {
    id: "notif-4",
    message: "Toko Baru berhasil dihubungkan",
    timestamp: "1 hari lalu",
    isRead: true,
    type: "success",
  },
  {
    id: "notif-5",
    message: "Update sistem tersedia",
    timestamp: "2 hari lalu",
    isRead: true,
    type: "info",
  },
];

interface HeaderProps {
  userEmail: string;
  userName?: string;
}

export function Header({ userEmail, userName }: HeaderProps) {
  const [notifications, setNotifications] = useState<Notification[]>(DUMMY_NOTIFICATIONS);
  const displayName = userName?.trim() || userEmail;
  const initials = displayName.substring(0, 2).toUpperCase();
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const { logout, isLoading } = useLogout();

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (message: string) => {
    alert(`Notifikasi: ${message}`);
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "warning":
        return "text-yellow-700 dark:text-yellow-400";
      case "alert":
        return "text-red-700 dark:text-red-400";
      case "success":
        return "text-green-700 dark:text-green-400";
      case "info":
        return "text-blue-700 dark:text-blue-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6 shadow-sm">
      <div />

      <div className="flex items-center gap-3">
        {/* Notification Bell Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
            <Bell className="h-4 w-4 transition-transform duration-200 ease-in-out hover:scale-110" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[0.6rem] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-sm font-semibold">Notifikasi</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="rounded px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  Tandai semua
                </button>
              )}
            </div>
            <DropdownMenuSeparator />

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  Tidak ada notifikasi
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b border-border p-3 transition-colors duration-200 hover:bg-muted/50 ${
                      !notification.isRead ? "bg-muted/30" : ""
                    }`}
                  >
                    <button
                      onClick={() => {
                        handleNotificationClick(notification.message);
                        handleMarkAsRead(notification.id);
                      }}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 flex h-2 w-2 shrink-0 rounded-full ${
                            notification.isRead
                              ? "bg-transparent"
                              : "bg-blue-500"
                          }`}
                        />
                        <div className="flex-1 space-y-1">
                          <p className={`text-sm font-medium leading-snug ${getTypeColor(notification.type)}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {notification.timestamp}
                          </p>
                        </div>
                      </div>
                    </button>
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

import { Bell, ChevronDown } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  userEmail: string;
  userName?: string;
}

export function Header({ userEmail, userName }: HeaderProps) {
  const displayName = userName?.trim() || userEmail;
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6 shadow-sm">
      <div />

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-xs" className="relative">
          <Bell className="h-4 w-4 transition-transform duration-200 ease-in-out group-hover/button:scale-110" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-bold text-primary-foreground transition-transform duration-200 ease-in-out group-hover/button:scale-110">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="group/menu flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-[background-color,transform] duration-200 ease-out hover:bg-accent active:scale-[0.98]">
              <Avatar className="h-7 w-7 transition-transform duration-200 ease-out group-hover/menu:scale-105">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-40 truncate">{displayName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ease-out group-hover/menu:translate-y-0.5" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Account</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

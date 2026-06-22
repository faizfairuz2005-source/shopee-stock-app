"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (installed)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    ) {
      setIsStandalone(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a short delay if not already dismissed
      let dismissed: string | null = null;
      try { dismissed = localStorage.getItem("pwa-install-dismissed"); } catch { /* private browsing */ }
      if (!dismissed) {
        setTimeout(() => setIsVisible(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Listen for the app installed event
    window.addEventListener("appinstalled", () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setIsDismissed(true);
    try { localStorage.setItem("pwa-install-dismissed", "true"); } catch { /* private browsing */ }
  }, []);

  if (isStandalone || !isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-xl border border-border bg-card p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Download className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Install MultiStore</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Install aplikasi ke layar beranda untuk akses lebih cepat
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-full p-1 hover:bg-muted transition-colors"
            aria-label="Tutup"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 text-xs"
            onClick={handleDismiss}
          >
            Nanti Saja
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs"
            onClick={handleInstall}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}

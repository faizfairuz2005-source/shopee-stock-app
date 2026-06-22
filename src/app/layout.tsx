import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/error-boundary";
import { ToastProvider } from "@/components/toast";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { initializeApp } from "@/lib/config/startup";

// Initialize app on startup (client-side)
if (typeof window !== "undefined") {
  initializeApp();
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const APP_NAME = "MultiStore";
const APP_DEFAULT_TITLE = "MultiStore — Manajemen Toko & POS";
const APP_TITLE_TEMPLATE = "%s — MultiStore";
const APP_DESCRIPTION = "Aplikasi manajemen inventory dan POS kasir untuk UMKM";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_DEFAULT_TITLE,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a1a" },
  ],
  viewportFit: "cover",
  minimumScale: 1,
  initialScale: 1,
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} dark h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <ToastProvider>
          <ErrorBoundary>
            {children}
            <PwaInstallPrompt />
          </ErrorBoundary>
        </ToastProvider>
      </body>
    </html>
  );
}

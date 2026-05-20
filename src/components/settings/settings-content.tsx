"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import {
  Bell,
  CreditCard,
  Database,
  Download,
  Globe,
  HardDrive,
  Laptop,
  Loader2,
  LogOut,
  MonitorCog,
  Shield,
  Upload,
  User,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardProfile } from "@/components/dashboard-shell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoleBadge } from "@/components/role-badge"
import { type Role, hasPermission } from "@/lib/permissions"
import { updateProfileAction } from "@/app/settings/actions"
import { useLogout } from "@/hooks/use-logout"
import Link from "next/link"

type NotificationState = {
  lowStockAlert: boolean
  newOrderAlert: boolean
  dailySummary: boolean
  weeklyReport: boolean
  browserPush: boolean
}

const DUMMY_SESSIONS = [
  { id: "session-1", device: "Windows PC - Chrome", location: "Bandung, ID", lastActive: "Aktif sekarang" },
  { id: "session-2", device: "iPhone 14 - Safari", location: "Bandung, ID", lastActive: "2 jam lalu" },
  { id: "session-3", device: "MacBook Air - Edge", location: "Jakarta, ID", lastActive: "Kemarin, 21:10" },
]

export function SettingsContent({
  initialFullName,
  initialEmail,
  initialPhone,
  userRole,
}: {
  initialFullName: string
  initialEmail: string
  initialPhone: string
  userRole?: Role | null
}) {
  const { setDisplayName } = useDashboardProfile()
  const { logout, isLoading } = useLogout()
  const [notifications, setNotifications] = useState<NotificationState>({
    lowStockAlert: true,
    newOrderAlert: true,
    dailySummary: false,
    weeklyReport: true,
    browserPush: true,
  })

  const [fullName, setFullName] = useState(initialFullName)
  const [email, setEmail] = useState(initialEmail)
  const [phone, setPhone] = useState(initialPhone)
  const [isPending, startTransition] = useTransition()
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<"success" | "error">("success")
  const initials = (fullName.trim() || email).slice(0, 2).toUpperCase()

  useEffect(() => {
    if (!toastMessage) return
    const timer = window.setTimeout(() => setToastMessage(null), 2500)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const onSaveProfile = () => {
    startTransition(async () => {
      const result = await updateProfileAction({
        fullName,
        email,
        phone,
      })

      if (!result.success) {
        setToastType("error")
        setToastMessage(result.error)
        return
      }

      setFullName(result.fullName)
      setEmail(result.email)
      setPhone(result.phone)
      setDisplayName(result.fullName)
      setToastType("success")
      setToastMessage("Profil berhasil diperbarui")
    })
  }

  const showUserManagement = hasPermission(userRole, "settings.users")
  const showBackupSection = hasPermission(userRole, "settings.backup-export")

  const [isExporting, setIsExporting] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [backupList, setBackupList] = useState<{ name: string; size: number; date: string }[]>([])
  const [downloadingBackup, setDownloadingBackup] = useState<string | null>(null)
  const [deletingBackup, setDeletingBackup] = useState<string | null>(null)
  const [showBackupList, setShowBackupList] = useState(false)
  const [restoreStatus, setRestoreStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // ── Auto-Backup state ──
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false)
  const [autoBackupInterval, setAutoBackupInterval] = useState(6)
  const [autoBackupStatus, setAutoBackupStatus] = useState<{
    nextBackupIn?: string
    totalBackups?: number
  } | null>(null)
  const [loadingAutoBackupStatus, setLoadingAutoBackupStatus] = useState(false)
  const [savingAutoBackup, setSavingAutoBackup] = useState(false)

  const handleExportJSON = async () => {
    setIsExporting(true)
    try {
      const { exportDatabaseJSON } = await import("@/app/actions")
      const result = await exportDatabaseJSON()
      if (!result.success || !result.data) {
        setToastType("error")
        setToastMessage(result.error || "Gagal mengexport database")
        return
      }
      // Create download
      const blob = new Blob([result.data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = result.filename || "multistore-backup.json"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setToastType("success")
      setToastMessage("Database berhasil di-export!")
    } catch (err) {
      console.error("Export failed:", err)
      setToastType("error")
      setToastMessage("Gagal mengexport database")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = async (entityType: string) => {
    setIsExporting(true)
    try {
      const { exportEntityCSV } = await import("@/app/actions")
      const result = await exportEntityCSV(entityType)
      if (!result.success || !result.data) {
        setToastType("error")
        setToastMessage(result.error || "Gagal mengexport CSV")
        return
      }
      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = result.filename || `${entityType}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setToastType("success")
      setToastMessage(`Data ${entityType} berhasil di-export!`)
    } catch (err) {
      console.error("CSV Export failed:", err)
      setToastType("error")
      setToastMessage("Gagal mengexport CSV")
    } finally {
      setIsExporting(false)
    }
  }

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".json")) {
      setRestoreStatus({ type: "error", message: "Hanya file JSON yang didukung" })
      return
    }

    // Read file
    const text = await file.text()

    // Basic validation
    try {
      JSON.parse(text)
    } catch {
      setRestoreStatus({ type: "error", message: "File JSON tidak valid" })
      return
    }

    // Confirm
    if (!window.confirm("Perhatian! Merestore database akan MENIMPA semua data saat ini.\n\nPastikan Anda sudah melakukan backup terlebih dahulu.\n\nLanjutkan restore?")) {
      e.target.value = ""
      return
    }

    setIsRestoring(true)
    setRestoreStatus(null)
    try {
      const { restoreDatabase } = await import("@/app/actions")
      const result = await restoreDatabase(text)
      if (!result.success) {
        setRestoreStatus({ type: "error", message: result.error || "Gagal merestore database" })
      } else {
        setRestoreStatus({
          type: "success",
          message: `Database berhasil di-restore! ${result.report?.totalProducts || 0} produk, ${result.report?.totalOrders || 0} pesanan.`,
        })
        setToastType("success")
        setToastMessage("Database berhasil di-restore! Halaman akan dimuat ulang...")
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch (err) {
      console.error("Restore failed:", err)
      setRestoreStatus({ type: "error", message: "Gagal merestore database" })
    } finally {
      setIsRestoring(false)
      e.target.value = ""
    }
  }

  const handleDownloadBackup = async (filename: string) => {
    setDownloadingBackup(filename)
    try {
      const { downloadBackupFile } = await import("@/app/actions")
      const result = await downloadBackupFile(filename)
      if (!result.success || !result.data) {
        setToastType("error")
        setToastMessage(result.error || "Gagal mengunduh backup")
        return
      }
      const blob = new Blob([result.data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setToastType("success")
      setToastMessage(`File ${filename} berhasil diunduh!`)
    } catch (err) {
      console.error("Download failed:", err)
      setToastType("error")
      setToastMessage("Gagal mengunduh backup")
    } finally {
      setDownloadingBackup(null)
    }
  }

  // ── Load auto-backup status on mount ──
  const loadAutoBackupStatus = useCallback(async () => {
    setLoadingAutoBackupStatus(true)
    try {
      const { getAutoBackupStatus } = await import("@/app/actions")
      const result = await getAutoBackupStatus()
      if (result.success && result.config) {
        setAutoBackupEnabled(result.config.enabled)
        setAutoBackupInterval(result.config.intervalHours)
        if (result.nextBackupIn) {
          setAutoBackupStatus({ nextBackupIn: result.nextBackupIn, totalBackups: result.totalBackups })
        } else {
          setAutoBackupStatus({ totalBackups: result.totalBackups })
        }
      }
    } catch (err) {
      console.error("Failed to load auto-backup status:", err)
    } finally {
      setLoadingAutoBackupStatus(false)
    }
  }, [])

  useEffect(() => {
    loadAutoBackupStatus()
  }, [loadAutoBackupStatus])

  const handleSaveAutoBackup = async () => {
    setSavingAutoBackup(true)
    try {
      const { updateAutoBackupConfig } = await import("@/app/actions")
      const result = await updateAutoBackupConfig({
        enabled: autoBackupEnabled,
        intervalHours: autoBackupInterval,
      })
      if (!result.success) {
        setToastType("error")
        setToastMessage(result.error || "Gagal menyimpan pengaturan")
        return
      }
      setToastType("success")
      setToastMessage(
        autoBackupEnabled
          ? `Backup otomatis aktif — setiap ${autoBackupInterval} jam`
          : "Backup otomatis dinonaktifkan"
      )
      loadAutoBackupStatus()
    } catch (err) {
      console.error("Failed to save auto-backup config:", err)
      setToastType("error")
      setToastMessage("Gagal menyimpan pengaturan")
    } finally {
      setSavingAutoBackup(false)
    }
  }

  const handleDeleteBackup = async (filename: string) => {
    if (!window.confirm(`Hapus file backup "${filename}"?\n\nTindakan ini tidak bisa dibatalkan.`)) {
      return
    }
    setDeletingBackup(filename)
    try {
      const { deleteBackupFile } = await import("@/app/actions")
      const result = await deleteBackupFile(filename)
      if (!result.success) {
        setToastType("error")
        setToastMessage(result.error || "Gagal menghapus backup")
        return
      }
      setBackupList((prev) => prev.filter((b) => b.name !== filename))
      setToastType("success")
      setToastMessage(`File ${filename} berhasil dihapus!`)
    } catch (err) {
      console.error("Delete failed:", err)
      setToastType("error")
      setToastMessage("Gagal menghapus backup")
    } finally {
      setDeletingBackup(null)
    }
  }

  const handleLoadBackups = async () => {
    try {
      const { listBackups } = await import("@/app/actions")
      const result = await listBackups()
      if (result.success && result.backups) {
        setBackupList(result.backups)
      }
    } catch (err) {
      console.error("Failed to load backups:", err)
    }
    setShowBackupList((prev) => !prev)
  }

  return (
    <div className="space-y-6 page-enter">
      {toastMessage ? (
        <div
          className={`fixed right-6 top-5 z-[70] rounded-lg border px-4 py-2 text-sm shadow-lg transition-all duration-200 ease-out ${
            toastType === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {toastMessage}
        </div>
      ) : null}

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Kelola profil, integrasi toko, notifikasi, dan keamanan akun Anda.
        </p>
      </div>

      {userRole && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Role Anda:</span>
          <RoleBadge role={userRole} />
        </div>
      )}

      <Tabs defaultValue="profile">
        <TabsList className="grid gap-1" style={{ gridTemplateColumns: showBackupSection && showUserManagement ? "repeat(6, 1fr)" : showBackupSection || showUserManagement ? "repeat(5, 1fr)" : "repeat(4, 1fr)" }}>
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifikasi</TabsTrigger>
          <TabsTrigger value="general"><MonitorCog className="mr-2 h-4 w-4" />General</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" />Security</TabsTrigger>
          {showBackupSection && (
            <TabsTrigger value="data"><Database className="mr-2 h-4 w-4" />Data</TabsTrigger>
          )}
          {showUserManagement && (
            <Link href="/settings/users">
              <TabsTrigger value="users" onClick={(e) => { e.preventDefault(); window.location.href = "/settings/users"; }}>
                <Users className="mr-2 h-4 w-4" />Users
              </TabsTrigger>
            </Link>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Informasi Profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button size="sm" variant="outline">Upload Foto</Button>
                  <p className="text-xs text-muted-foreground">PNG/JPG maksimal 2MB.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Nama Lengkap</Label>
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nama@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor HP</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFullName(initialFullName)
                    setEmail(initialEmail)
                    setPhone(initialPhone)
                  }}
                  disabled={isPending}
                >
                  Reset
                </Button>
                <Button onClick={onSaveProfile} disabled={isPending}>
                  {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Ubah Password</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="current-password">Password Lama</Label>
                <Input id="current-password" type="password" placeholder="********" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Password Baru</Label>
                <Input id="new-password" type="password" placeholder="********" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                <Input id="confirm-password" type="password" placeholder="********" />
              </div>
              <div className="md:col-span-3 md:flex md:justify-end">
                <Button>Update Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Pengaturan Notifikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <NotificationRow
                title="Alert stok rendah"
                description="Dapatkan notifikasi saat stok produk di bawah ambang batas."
                checked={notifications.lowStockAlert}
                onChange={(checked) => setNotifications((prev) => ({ ...prev, lowStockAlert: checked }))}
              />
              <NotificationRow
                title="Order baru"
                description="Notifikasi real-time untuk pesanan masuk dari semua toko."
                checked={notifications.newOrderAlert}
                onChange={(checked) => setNotifications((prev) => ({ ...prev, newOrderAlert: checked }))}
              />
              <NotificationRow
                title="Ringkasan harian"
                description="Kirim ringkasan performa harian setiap pukul 20:00."
                checked={notifications.dailySummary}
                onChange={(checked) => setNotifications((prev) => ({ ...prev, dailySummary: checked }))}
              />
              <NotificationRow
                title="Laporan mingguan"
                description="Kirim recap weekly via email setiap Senin pagi."
                checked={notifications.weeklyReport}
                onChange={(checked) => setNotifications((prev) => ({ ...prev, weeklyReport: checked }))}
              />
              <NotificationRow
                title="Browser push notification"
                description="Tampilkan notifikasi langsung di desktop browser."
                checked={notifications.browserPush}
                onChange={(checked) => setNotifications((prev) => ({ ...prev, browserPush: checked }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Preferensi Umum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nama Aplikasi" id="app-name" defaultValue="MultiStore Pro" icon={Laptop} />
                <Field label="Timezone" id="timezone" defaultValue="Asia/Jakarta (GMT+7)" icon={Globe} />
                <Field label="Bahasa" id="language" defaultValue="Bahasa Indonesia" icon={Globe} />
                <Field label="Currency Default" id="currency" defaultValue="IDR - Rupiah" icon={CreditCard} />
              </div>
              <div className="flex justify-end">
                <Button>Simpan Pengaturan</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Session Aktif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DUMMY_SESSIONS.map((session, index) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border border-border/80 p-4 transition-colors duration-200 ease-out hover:bg-muted/40"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{session.device}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.location} · {session.lastActive}
                    </p>
                  </div>
                  {index === 0 ? <Badge>Current</Badge> : <Button variant="outline" size="sm">Revoke</Button>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="card-hover border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Zona Keamanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Logout dari akun</p>
                  <p className="text-xs text-muted-foreground">
                    Keluar dari akun Anda di perangkat ini.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={logout}
                  disabled={isLoading}
                  className="gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  {isLoading ? 'Logging out...' : 'Logout'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Logout semua perangkat</p>
                  <p className="text-xs text-muted-foreground">
                    Semua session selain perangkat ini akan dihentikan.
                  </p>
                </div>
                <Button variant="destructive" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout Semua
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {showBackupSection && (
          <TabsContent value="data" className="space-y-4">
            {/* ── Backup / Export ── */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-primary" />
                  Backup &amp; Export Database
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Export seluruh data database atau per-entitas untuk backup atau migrasi.
                  File JSON berisi data lengkap, sedangkan CSV per entitas untuk analisis di spreadsheet.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* JSON Export */}
                  <div className="rounded-lg border border-border/70 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Download className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Full Database (JSON)</p>
                        <p className="text-xs text-muted-foreground">Seluruh data dalam satu file</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mencakup: produk, pesanan, supplier, pengeluaran, retur, penyesuaian stok, paket barang, barang masuk.
                    </p>
                    <Button
                      onClick={handleExportJSON}
                      disabled={isExporting}
                      className="w-full gap-2"
                      size="sm"
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {isExporting ? "Mengexport..." : "Export JSON"}
                    </Button>
                  </div>

                  {/* Per-Entity CSV Export */}
                  <div className="rounded-lg border border-border/70 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Database className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Per Entitas (CSV)</p>
                        <p className="text-xs text-muted-foreground">Export per tabel untuk analisis</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "products", label: "Produk" },
                        { key: "orders", label: "Pesanan" },
                        { key: "suppliers", label: "Supplier" },
                        { key: "expenses", label: "Pengeluaran" },
                        { key: "returns", label: "Retur" },
                        { key: "adjustments", label: "Adjust Stok" },
                        { key: "kits", label: "Paket Barang" },
                        { key: "goodsReceipts", label: "Barang Masuk" },
                      ].map((entity) => (
                        <Button
                          key={entity.key}
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportCSV(entity.key)}
                          disabled={isExporting}
                          className="gap-1.5 text-xs h-8 justify-start"
                        >
                          <Download className="h-3 w-3 shrink-0" />
                          {entity.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent backups list */}
                <div className="pt-2 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadBackups}
                    className="gap-2 text-xs text-muted-foreground"
                  >
                    <HardDrive className="h-3.5 w-3.5" />
                    {showBackupList ? "Sembunyikan" : "Lihat"} riwayat backup
                  </Button>
                  {showBackupList && (
                    <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                      {backupList.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                          Belum ada backup tersimpan.
                        </p>
                      ) : (
                        backupList.map((b) => (
                          <div
                            key={b.name}
                            className="group flex items-center justify-between rounded-lg border border-border/40 px-3 py-2 text-xs hover:bg-muted/50 hover:border-border/80 transition-all"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <HardDrive className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                              <span className="truncate font-mono text-[0.7rem]">{b.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <span className="text-muted-foreground text-[0.65rem] tabular-nums">
                                {(b.size / 1024).toFixed(1)} KB
                              </span>
                              <button
                                onClick={() => handleDownloadBackup(b.name)}
                                disabled={downloadingBackup === b.name}
                                className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                                title="Download backup ini"
                              >
                                {downloadingBackup === b.name ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteBackup(b.name)}
                                disabled={deletingBackup === b.name}
                                className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-destructive/30 disabled:opacity-50"
                                title="Hapus backup ini"
                              >
                                {deletingBackup === b.name ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── Auto Backup ── */}
            <Card className="card-hover">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Backup Otomatis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Backup database secara otomatis setiap interval waktu tertentu.
                  File backup disimpan di folder <code className="text-xs bg-muted px-1 py-0.5 rounded">backups/</code> dengan prefix <code className="text-xs bg-muted px-1 py-0.5 rounded">autobackup-</code>.
                </p>

                {loadingAutoBackupStatus ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Memuat status...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Status row */}
                    <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            autoBackupEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                          }`}
                        />
                        <span className="text-sm font-medium">
                          {autoBackupEnabled ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {autoBackupEnabled && autoBackupStatus?.nextBackupIn && (
                          <span>Backup berikutnya: {autoBackupStatus.nextBackupIn}</span>
                        )}
                        {autoBackupStatus?.totalBackups !== undefined && (
                          <span className="tabular-nums">
                            {autoBackupStatus.totalBackups} file autobackup
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toggle + Interval selector */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-3">
                        <Label htmlFor="auto-backup-toggle" className="text-sm font-medium">
                          Aktifkan Backup Otomatis
                        </Label>
                        <div className="flex items-center gap-3">
                          <Switch
                            id="auto-backup-toggle"
                            checked={autoBackupEnabled}
                            onCheckedChange={setAutoBackupEnabled}
                          />
                          <span className="text-sm text-muted-foreground">
                            {autoBackupEnabled ? "Backup berjalan otomatis" : "Backup hanya manual"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="auto-backup-interval" className="text-sm font-medium">
                          Interval Backup
                        </Label>
                        <div className="flex items-center gap-2">
                          <select
                            id="auto-backup-interval"
                            value={autoBackupInterval}
                            onChange={(e) => setAutoBackupInterval(Number(e.target.value))}
                            disabled={!autoBackupEnabled}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value={1}>Setiap 1 jam</option>
                            <option value={2}>Setiap 2 jam</option>
                            <option value={3}>Setiap 3 jam</option>
                            <option value={6}>Setiap 6 jam</option>
                            <option value={8}>Setiap 8 jam</option>
                            <option value={12}>Setiap 12 jam</option>
                            <option value={24}>Setiap 24 jam (harian)</option>
                            <option value={48}>Setiap 48 jam (2 hari)</option>
                            <option value={72}>Setiap 72 jam (3 hari)</option>
                            <option value={168}>Setiap 168 jam (7 hari)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveAutoBackup}
                        disabled={savingAutoBackup || loadingAutoBackupStatus}
                        className="gap-2"
                        size="sm"
                      >
                        {savingAutoBackup ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {savingAutoBackup ? "Menyimpan..." : "Simpan Pengaturan"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Restore ── */}
            <Card className="card-hover border-amber-200/50 dark:border-amber-800/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Upload className="h-5 w-5" />
                  Restore Database
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/30 p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5">
                    ⚠️ Perhatian
                  </p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-1">
                    Merestore database akan MENIMPA seluruh data yang ada saat ini.
                    Sebelum merestore, pastikan Anda sudah melakukan backup.
                    Backup otomatis akan dibuat sebelum restore.
                  </p>
                </div>

                {restoreStatus && (
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      restoreStatus.type === "success"
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                    }`}
                  >
                    {restoreStatus.message}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestore}
                    disabled={isRestoring}
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer file:transition-colors disabled:opacity-50"
                  />
                  {isRestoring && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Merestore...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function NotificationRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border/70 p-4">
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function Field({
  label,
  id,
  defaultValue,
  icon: Icon,
}: {
  label: string
  id: string
  defaultValue: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id={id} defaultValue={defaultValue} className="pl-9" />
      </div>
    </div>
  )
}

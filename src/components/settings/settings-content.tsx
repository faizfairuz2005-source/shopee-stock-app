"use client"

import { useEffect, useState, useTransition } from "react"
import {
  Bell,
  CreditCard,
  Globe,
  Laptop,
  LogOut,
  MonitorCog,
  Shield,
  Store,
  User,
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
import { updateProfileAction } from "@/app/settings/actions"

type NotificationState = {
  lowStockAlert: boolean
  newOrderAlert: boolean
  dailySummary: boolean
  weeklyReport: boolean
  browserPush: boolean
}

const DUMMY_SHOPS = [
  { id: "shop-1", name: "Faiz Fashion Official", region: "ID", shopId: 12093411, status: "Aktif" },
  { id: "shop-2", name: "Urban Sneaker Hub", region: "ID", shopId: 12093412, status: "Aktif" },
  { id: "shop-3", name: "Daily Essentials Store", region: "SG", shopId: 12093413, status: "Sinkronisasi" },
]

const DUMMY_SESSIONS = [
  { id: "session-1", device: "Windows PC - Chrome", location: "Bandung, ID", lastActive: "Aktif sekarang" },
  { id: "session-2", device: "iPhone 14 - Safari", location: "Bandung, ID", lastActive: "2 jam lalu" },
  { id: "session-3", device: "MacBook Air - Edge", location: "Jakarta, ID", lastActive: "Kemarin, 21:10" },
]

export function SettingsContent({
  initialFullName,
  initialEmail,
  initialPhone,
}: {
  initialFullName: string
  initialEmail: string
  initialPhone: string
}) {
  const { setDisplayName } = useDashboardProfile()
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

  return (
    <div className="space-y-6 page-enter">
      {toastMessage ? (
        <div
          className={`fixed right-6 top-5 z-[70] rounded-lg border px-4 py-2 text-sm shadow-lg transition-all duration-200 ease-out ${
            toastType === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300"
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

      <Tabs defaultValue="profile">
        <TabsList className="grid gap-1 md:grid-cols-5">
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="shops"><Store className="mr-2 h-4 w-4" />Toko Shopee</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifikasi</TabsTrigger>
          <TabsTrigger value="general"><MonitorCog className="mr-2 h-4 w-4" />General</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" />Security</TabsTrigger>
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

        <TabsContent value="shops" className="space-y-4">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Toko Shopee Terhubung</CardTitle>
              <Button>Sambungkan Toko Baru</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {DUMMY_SHOPS.map((shop) => (
                <div
                  key={shop.id}
                  className="flex items-center justify-between rounded-lg border border-border/80 p-4 transition-[background-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-px hover:bg-muted/40 hover:shadow-sm"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{shop.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Region {shop.region} · Shop ID {shop.shopId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{shop.status}</Badge>
                    <Button variant="outline" size="sm">Kelola</Button>
                  </div>
                </div>
              ))}
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
                <Field label="Nama Aplikasi" id="app-name" defaultValue="MultiStock Pro" icon={Laptop} />
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
            <CardContent className="flex items-center justify-between">
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
            </CardContent>
          </Card>
        </TabsContent>
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

import { createClient } from './client'
import { toast } from 'sonner'

export const logout = async () => {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    
    if (error) throw error
    
    toast.success("Berhasil logout")
    window.location.href = '/login'   // pakai window.location biar lebih kuat
  } catch (error) {
    console.error(error)
    toast.error("Gagal logout, coba lagi")
  }
}
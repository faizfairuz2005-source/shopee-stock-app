"use server";

import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";

export type UpdateProfilePayload = {
  fullName: string;
  email: string;
  phone: string;
};

export type UpdateProfileResult =
  | { success: true; fullName: string; email: string; phone: string }
  | { success: false; error: string };

export async function updateProfileAction(payload: UpdateProfilePayload): Promise<UpdateProfileResult> {
  const fullName = payload.fullName.trim();
  const email = payload.email.trim();
  const phone = payload.phone.trim();

  if (!fullName) {
    return { success: false, error: "Nama lengkap wajib diisi." };
  }

  if (!email) {
    return { success: false, error: "Email wajib diisi." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Sesi tidak valid. Silakan login ulang." };
  }

  const updatePayload: {
    email?: string;
    data: { full_name: string; phone: string };
  } = {
    data: {
      full_name: fullName,
      phone,
    },
  };

  if (email !== user.email) {
    updatePayload.email = email;
  }

  const { error } = await supabase.auth.updateUser(updatePayload);

  if (error) {
    return { success: false, error: error.message || "Gagal memperbarui profil." };
  }

  return {
    success: true,
    fullName,
    email,
    phone,
  };
}

/**
 * Upload avatar image — saves to public/uploads/avatars/ and updates user metadata.
 */
export async function uploadAvatarAction(formData: FormData): Promise<{
  success: boolean;
  avatarUrl?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Sesi tidak valid. Silakan login ulang." };
    }

    const file = formData.get("avatar") as File | null;
    if (!file) {
      return { success: false, error: "Tidak ada file yang dipilih." };
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Hanya file JPEG, PNG, WebP, atau GIF yang diperbolehkan." };
    }

    // Validasi ukuran (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return { success: false, error: "Ukuran file maksimal 2MB." };
    }

    // Generate nama file unik
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `avatar-${user.id}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");

    // Pastikan direktori ada
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Simpan file
    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // URL publik untuk diakses browser
    const avatarUrl = `/uploads/avatars/${filename}`;

    // Simpan avatar_url di user metadata Supabase
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: avatarUrl,
      },
    });

    if (updateError) {
      // Hapus file jika gagal update metadata
      try { fs.unlinkSync(filePath); } catch { /* noop */ }
      return { success: false, error: "Gagal menyimpan pengaturan avatar." };
    }

    // Hapus avatar lama jika ada (dari metadata sebelumnya)
    const oldAvatarUrl = user.user_metadata?.avatar_url as string | undefined;
    if (oldAvatarUrl && oldAvatarUrl.startsWith("/uploads/avatars/") && oldAvatarUrl !== avatarUrl) {
      const oldPath = path.join(process.cwd(), "public", oldAvatarUrl);
      try {
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch { /* noop — non-critical */ }
    }

    return { success: true, avatarUrl };
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return { success: false, error: "Gagal mengupload foto profil." };
  }
}

/**
 * Delete avatar — removes the file and clears avatar_url from user metadata.
 */
export async function deleteAvatarAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Sesi tidak valid. Silakan login ulang." };
    }

    const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
    if (avatarUrl && avatarUrl.startsWith("/uploads/avatars/")) {
      const filePath = path.join(process.cwd(), "public", avatarUrl);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch { /* noop */ }
    }

    // Hapus dari metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: null,
      },
    });

    if (updateError) {
      return { success: false, error: "Gagal menghapus foto profil." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting avatar:", error);
    return { success: false, error: "Gagal menghapus foto profil." };
  }
}

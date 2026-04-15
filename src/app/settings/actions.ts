"use server";

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

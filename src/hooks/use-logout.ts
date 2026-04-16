"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

interface UseLogoutReturn {
  logout: () => Promise<void>;
  isLoading: boolean;
}

export function useLogout(): UseLogoutReturn {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const logout = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Show success toast
      showToast('Berhasil logout', 'success');

      // Small delay to show the toast before redirect
      setTimeout(() => {
        router.push('/login');
        router.refresh();
      }, 500);

    } catch (error) {
      console.error('Logout error:', error);

      // Show error toast
      showToast('Gagal logout. Silakan coba lagi.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return { logout, isLoading };
}
"use server";

import { redirect } from "next/navigation";
import { logoutUser } from "@/lib/auth";

export async function signOutAction() {
  try {
    await logoutUser();
  } catch (error) {
    console.error('Logout error:', error);
    // Continue with redirect even if logout fails
  }

  redirect("/login");
}

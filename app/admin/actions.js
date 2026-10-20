"use server";

import { redirect } from "next/navigation";
import { buatKlienAdmin } from "@/lib/supabase/server";

export async function login(prevStateOrFormData, maybeFormData) {
  const formData =
    maybeFormData instanceof FormData ? maybeFormData : prevStateOrFormData;

  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  let supabase;
  try {
    supabase = await buatKlienAdmin();
  } catch (err) {
    return { error: err.message || "Konfigurasi Supabase belum lengkap." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Email atau password salah."
          : error.message,
    };
  }

  redirect("/admin");
}

export const masuk = login;

export async function logout() {
  try {
    const supabase = await buatKlienAdmin();
    await supabase.auth.signOut();
  } catch (err) {
    // Abaikan jika sudah tidak ada sesi aktif
  }

  redirect("/admin/login");
}

export const keluar = logout;


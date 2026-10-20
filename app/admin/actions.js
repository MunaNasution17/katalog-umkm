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

export async function gantiPassword(prevStateOrFormData, maybeFormData) {
  const formData =
    maybeFormData instanceof FormData ? maybeFormData : prevStateOrFormData;

  const passwordBaru = formData.get("password_baru")?.toString() || "";
  const konfirmasiPassword =
    formData.get("konfirmasi_password")?.toString() || "";

  if (!passwordBaru || !konfirmasiPassword) {
    return { error: "Semua kolom password wajib diisi." };
  }

  // Validasi di server: password baru minimal 8 karakter
  if (passwordBaru.length < 8) {
    return { error: "Password baru minimal 8 karakter." };
  }

  // Validasi di server: harus sama dengan konfirmasi
  if (passwordBaru !== konfirmasiPassword) {
    return { error: "Password baru dan konfirmasi password harus sama." };
  }

  let supabase;
  try {
    supabase = await buatKlienAdmin();
  } catch (err) {
    return { error: err.message || "Konfigurasi Supabase belum lengkap." };
  }

  // Wajib periksa di server bahwa admin sudah login (Aturan Keamanan 3)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "Sesi login tidak valid atau sudah kedaluwarsa. Silakan login kembali.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: passwordBaru,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password berhasil diganti." };
}

export const changePassword = gantiPassword;

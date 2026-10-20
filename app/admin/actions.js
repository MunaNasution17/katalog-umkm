"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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

// US-08: Tambah produk baru
export async function tambahProduk(prevStateOrFormData, maybeFormData) {
  const formData =
    maybeFormData instanceof FormData ? maybeFormData : prevStateOrFormData;

  const nama = formData.get("nama")?.toString().trim();
  const harga = formData.get("harga")?.toString().trim();
  const kategori = formData.get("kategori")?.toString().trim();
  const foto_url = formData.get("foto_url")?.toString().trim();
  const deskripsi = formData.get("deskripsi")?.toString().trim();

  // 1. Validasi input di server
  if (!nama) {
    return { error: "Nama produk wajib diisi." };
  }

  const hargaAngka = Number(harga);
  if (!harga || isNaN(hargaAngka) || hargaAngka < 0) {
    return { error: "Harga produk harus berupa angka dan tidak boleh kurang dari 0." };
  }

  // 2. Inisialisasi klien admin
  let supabase;
  try {
    supabase = await buatKlienAdmin();
  } catch (err) {
    return { error: err.message || "Konfigurasi Supabase belum lengkap." };
  }

  // 3. Wajib periksa di server bahwa admin sudah login (Aturan Keamanan 3)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "Sesi login tidak valid atau sudah kedaluwarsa. Silakan login kembali.",
    };
  }

  // 4. Simpan ke database Supabase
  const { error: insertError } = await supabase.from("produk").insert([
    {
      nama,
      harga: Math.round(hargaAngka),
      kategori: kategori || null,
      foto_url: foto_url || null,
      deskripsi: deskripsi || null,
    },
  ]);

  if (insertError) {
    return {
      error: insertError.message || "Gagal menyimpan produk ke database.",
    };
  }

  // 5. Perbarui cache halaman katalog dan admin
  revalidatePath("/admin");
  revalidatePath("/");

  // 6. Kembali ke halaman /admin
  redirect("/admin");
}

export const createProduct = tambahProduk;

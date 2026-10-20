import { createClient } from "@supabase/supabase-js";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Koneksi server untuk pengunjung (SUPABASE_SECRET_KEY)
// Dipakai untuk membaca katalog dan detail produk secara publik (bypass RLS)
export function buatKlienServer() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "SUPABASE_URL atau SUPABASE_SECRET_KEY belum diisi di environment variable."
    );
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Koneksi sesi admin (SUPABASE_PUBLISHABLE_KEY + cookie)
// Dipakai untuk login, logout, ganti password, dan aksi admin yang menjaga RLS
export async function buatKlienAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "SUPABASE_URL atau SUPABASE_PUBLISHABLE_KEY belum diisi di environment variable."
    );
  }

  const cookieStore = await cookies();

  return createSSRServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Abaikan jika dipanggil saat Server Component sedang me-render
        }
      },
    },
  });
}

export const createServerClient = buatKlienServer;
export const buatKlienSesiAdmin = buatKlienAdmin;
export const createAdminClient = buatKlienAdmin;
export default buatKlienServer;

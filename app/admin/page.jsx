import { redirect } from "next/navigation";
import NavAdmin from "@/components/NavAdmin";
import TabelProduk from "@/components/TabelProduk";
import Tombol from "@/components/Tombol";
import { buatKlienAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// US-07: daftar produk di /admin diambil dari database Supabase
export default async function HalamanAdmin() {
  let supabase;
  let user = null;

  try {
    supabase = await buatKlienAdmin();
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (!authError && currentUser) {
      user = currentUser;
    }
  } catch (err) {
    user = null;
  }

  // Wajib periksa login admin di sisi server (Aturan Keamanan 3 & 4)
  if (!user) {
    redirect("/admin/login");
  }

  let daftarProduk = [];
  let pesanError = null;

  try {
    const { data, error } = await supabase
      .from("produk")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      pesanError = error.message;
    } else {
      daftarProduk = data || [];
    }
  } catch (err) {
    pesanError = err.message || "Terjadi kesalahan saat memuat data produk.";
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Produk</h1>
        {/* US-08 (bonus): tambah produk */}
        <Tombol href="/admin/produk/baru">Tambah produk</Tombol>
      </div>

      {pesanError ? (
        <div className="rounded-xl border border-garis bg-permukaan p-4 text-sm text-bahaya">
          <p className="font-semibold">Gagal memuat produk</p>
          <p className="mt-1">{pesanError}</p>
        </div>
      ) : daftarProduk.length === 0 ? (
        <p className="rounded-2xl border border-garis bg-permukaan p-8 text-center text-teks-lembut">
          Belum ada produk
        </p>
      ) : (
        <TabelProduk daftarProduk={daftarProduk} />
      )}
    </div>
  );
}

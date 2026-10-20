import { redirect } from "next/navigation";
import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { buatKlienAdmin } from "@/lib/supabase/server";
import { tambahProduk } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

// US-08: tambah produk baru ke database Supabase
export default async function HalamanTambahProduk() {
  let user = null;

  try {
    const supabase = await buatKlienAdmin();
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

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Tambah produk</h1>
      <FormProduk labelTombol="Simpan produk" action={tambahProduk} />
    </div>
  );
}

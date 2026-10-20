import { notFound, redirect } from "next/navigation";
import NavAdmin from "@/components/NavAdmin";
import FormProduk from "@/components/FormProduk";
import { buatKlienAdmin } from "@/lib/supabase/server";
import { ubahProduk } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

// US-09: ubah produk yang tersimpan di Supabase
export default async function HalamanUbahProduk({ params }) {
  const { id } = await params;

  let user = null;
  let supabase;

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

  let produk = null;

  try {
    const { data, error } = await supabase
      .from("produk")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      produk = data;
    }
  } catch (err) {
    produk = null;
  }

  if (!produk) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <NavAdmin />
      <h1 className="text-2xl font-extrabold">Ubah produk</h1>
      <FormProduk produk={produk} labelTombol="Simpan perubahan" action={ubahProduk} />
    </div>
  );
}

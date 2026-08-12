import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ServiceManager } from "@/components/ServiceList/ServiceManager";
import { HoursManager } from "@/components/HoursManager/HoursManager";

interface ManageShopPageProps {
  params: { shopId: string };
}

export default async function ManageShopPage({ params }: ManageShopPageProps) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: shop } = await supabase.from("shops").select("*").eq("id", params.shopId).single();

  if (!shop) notFound();
  if (shop.owner_id !== user.id) redirect("/barber/dashboard");

  const [{ data: services }, { data: hours }] = await Promise.all([
    supabase.from("services").select("*").eq("shop_id", shop.id).order("created_at"),
    supabase.from("shop_hours").select("*").eq("shop_id", shop.id),
  ]);

  return (
    <section className="l-section l-container">
      <div className="dashboard-header">
        <div>
          <p className="hero__eyebrow">Manage shop</p>
          <h1 className="section-title" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
            {shop.name}
          </h1>
        </div>
        <Link href={`/shops/${shop.id}`} className="btn btn--outline btn--sm">
          View public page &rarr;
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" }}>
        <div>
          <h2 className="section-title" style={{ fontSize: "var(--fs-lg)" }}>
            Services
          </h2>
          <ServiceManager shopId={shop.id} initialServices={services ?? []} />
        </div>

        <div>
          <h2 className="section-title" style={{ fontSize: "var(--fs-lg)" }}>
            Opening hours
          </h2>
          <HoursManager shopId={shop.id} initialHours={hours ?? []} />
        </div>
      </div>
    </section>
  );
}

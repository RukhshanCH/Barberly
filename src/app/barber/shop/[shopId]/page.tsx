import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ServiceManager } from "@/components/ServiceList/ServiceManager";
import { HoursManager } from "@/components/HoursManager/HoursManager";
import { StaffManager } from "@/components/StaffManager/StaffManager";
import { PhotoUploader } from "@/components/PhotoUploader/PhotoUploader";
import { CancellationPolicyForm } from "./CancellationPolicyForm";

interface ManageShopPageProps {
  params: Promise<{ shopId: string }>;
}

export default async function ManageShopPage({ params }: ManageShopPageProps) {
  const supabase = await createClient();
  const { shopId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: shop } = await supabase.from("shops").select("*").eq("id", shopId).single();

  if (!shop) notFound();
  if (shop.owner_id !== user.id) redirect("/barber/dashboard");

  const [{ data: services }, { data: hours }, { data: staff }, { data: photos }] = await Promise.all([
    supabase.from("services").select("*").eq("shop_id", shop.id).order("created_at"),
    supabase.from("shop_hours").select("*").eq("shop_id", shop.id),
    supabase.from("shop_staff").select("*").eq("shop_id", shop.id).order("created_at"),
    supabase.from("shop_photos").select("*").eq("shop_id", shop.id).order("sort_order"),
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

        <div>
          <h2 className="section-title" style={{ fontSize: "var(--fs-lg)" }}>
            Barbers
          </h2>
          <StaffManager shopId={shop.id} initialStaff={staff ?? []} />
        </div>

        <div>
          <h2 className="section-title" style={{ fontSize: "var(--fs-lg)" }}>
            Cancellation policy
          </h2>
          <CancellationPolicyForm shopId={shop.id} initialMinutes={shop.cancellation_cutoff_minutes} />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <h2 className="section-title" style={{ fontSize: "var(--fs-lg)" }}>
            Photos
          </h2>
          <PhotoUploader shopId={shop.id} initialPhotos={photos ?? []} />
        </div>
      </div>
    </section>
  );
}

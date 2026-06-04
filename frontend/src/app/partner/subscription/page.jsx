import React from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PartnerGuard from "@/app/partner/PartnerGuard";
import PricingSection from "../PricingSection";

export default function Page() {
  return (
    <PartnerGuard>
      <AdminLayout>
        <PricingSection />
      </AdminLayout>
    </PartnerGuard>
  );
}
"use client";

import React, { useEffect, useMemo, useState } from "react";
import PricingCard from "../../components/ui/Priceingcard";
import paymentApi from "@/services/paymentApi";
import cmsApi from "@/services/cms";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";

const PLAN_KEY_MAP = {
  "Basic Plan": "BASIC",
  "Modern Plan": "MODERN",
  "Premium Plan": "PREMIUM",
  BASIC: "BASIC",
  MODERN: "MODERN",
  PREMIUM: "PREMIUM",
};

export default function PricingSection() {
  const [loadingKey, setLoadingKey] = useState(null);
  const [userSub, setUserSub] = useState(null);

  const [cancelLoading, setCancelLoading] = useState(false);

  const [plans, setPlans] = useState([]);

  const handleCancelSubscription = async () => {
    try {
      if (!userSub?.paypal_subscription_id) {
        return alert("Subscription ID not found");
      }

      const confirmed = window.confirm(
        "Are you sure you want to cancel your subscription?"
      );

      if (!confirmed) return;

      setCancelLoading(true);

      const res = await paymentApi.cancelSubscription(
        userSub.paypal_subscription_id
      );

      alert(res?.data?.message || "Subscription cancelled. Please login again.");

      // ✅ Clear storage
      localStorage.clear();

      // ✅ Optional: clear session storage too
      sessionStorage.clear();

      // ✅ Redirect login
      window.location.href = "/login";

    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
        err?.message ||
        "Cancellation failed"
      );
    } finally {
      setCancelLoading(false);
    }
  };

  useEffect(() => {
    fetchMySubscription();
    fetchPlans();
  }, []);

  const fetchMySubscription = async () => {
    try {
      const res = await paymentApi.getMySubscription();

      console.log("subscription response", res.data);

      if (res?.data?.success) {
        setUserSub(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch subscription", err);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await cmsApi.getPlanDetails();

      console.log("plans response", res.data);

      if (res?.data?.success) {
        setPlans(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch plans", err);
    }
  };

  const subState = useMemo(() => {
    if (!userSub) return { type: "none" };

    const isActive = userSub?.subscription === 1; // ✅ FIX
    const status = userSub?.status;
    const endDate = userSub?.end_date ? new Date(userSub.end_date) : null; // ✅ FIX
    const now = new Date();

    const isValidByDate = endDate ? endDate > now : true;

    if (isActive && status === "ACTIVE" && isValidByDate)
      return { type: "active" };

    if (status === "PENDING") return { type: "pending" };

    if (isActive && endDate && !isValidByDate)
      return { type: "expired" };

    return { type: "inactive" };
  }, [userSub]);


  // ✅ Active plan key for badge/disable
  const activePlanKey =
    subState.type === "active"
      ? userSub?.plan_key // ✅ FIX
      : null;



  const handleSelectPlan = async (plan) => {
    try {
      const raw = localStorage.getItem("USER");

      if (!raw) {
        alert("Please login again.");
        return;
      }

      const user = JSON.parse(raw);

      // console.log("user", user?.last_name)

      const userId = user?.id || user?.user_details?._id;

      const email =
        user?.email || user?.user_details?.email;

      const username =
        user?.username ||
        user?.user_details?.username ||
        (email ? email.split("@")[0] : "user");

      const name =

        `${user?.first_name} ${user?.last_name}`.trim();

      // ✅ directly from API
      const planKey = plan.plan_key;

      if (!planKey) {
        alert("Invalid plan selected.");
        return;
      }

      setLoadingKey(planKey);

      const payload = {
        planKey,
        userId,
        username,
        name,
        email,
      };

      const res = await paymentApi.createSubscription(payload);

      const approvalUrl =
        res?.data?.approvalUrl ||
        res?.data?.data?.approvalUrl ||
        res?.data?.links?.find((l) => l?.rel === "approve")?.href;

      if (approvalUrl) {
        // window.location.href = approvalUrl;
        return;
      }

      alert(res?.data?.message || "Subscription failed");

    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
        err?.message ||
        "Subscription failed"
      );
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="p-6">
      {/* ✅ Announcement Bar */}
      {subState.type !== "none" && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 flex items-start gap-3
            ${subState.type === "active"
              ? "bg-green-50 border-green-200 text-green-800"
              : subState.type === "pending"
                ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                : subState.type === "expired"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-gray-50 border-gray-200 text-gray-800"
            }
          `}
        >
          <div className="mt-0.5">
            {subState.type === "active" ? (
              <CheckCircle2 size={20} />
            ) : subState.type === "pending" ? (
              <Clock size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
          </div>

          <div className="flex-1">
            {/* {subState.type === "active" && (
              <>
                <div className="font-semibold">Active Subscription {activePlanKey}</div>
                <div className="text-sm opacity-90">
                  Valid until{" "}
                  {userSub?.end_date
                    ? new Date(userSub.end_date).toLocaleDateString()
                    : "—"}
                </div>
              </>
            )} */}
            {subState.type === "active" && (
              <>
                <div className="font-semibold">
                  Active Subscription {activePlanKey}
                </div>

                <div className="text-sm opacity-90">
                  Valid until{" "}
                  {userSub?.end_date
                    ? new Date(userSub.end_date).toLocaleDateString("en-GB")
                    : "—"}
                </div>

                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                  className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium transition
        ${cancelLoading
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                >
                  {cancelLoading ? "Cancelling..." : "Cancel Subscription"}
                </button>
              </>
            )}

            {subState.type === "pending" && (
              <>
                <div className="font-semibold">Subscription Pending: {userSub?.planKey}</div>
                <div className="text-sm opacity-90">
                  Complete payment approval to activate your plan.
                </div>
              </>
            )}

            {subState.type === "expired" && (
              <>
                <div className="font-semibold">Subscription Expired</div>
                <div className="text-sm opacity-90">
                  Please renew to continue using partner features.
                </div>
              </>
            )}

            {subState.type === "inactive" && (
              <>
                <div className="font-semibold">No Active Subscription</div>
                <div className="text-sm opacity-90">Choose a plan below to activate your account.</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan, index) => {

          const planKey = plan.plan_key;

          return (
            <PricingCard
              key={plan._id || index}
              plan={{
                title: plan.plan_name,
                price: plan.amount,
                duration: plan.duration || "month",
                description: plan.description,
                features: Array.isArray(plan.features)
                  ? plan.features
                  : [],
              }}
              planKey={planKey}
              isActive={activePlanKey === planKey}
              onSelect={() => handleSelectPlan(plan)}
              loading={loadingKey === planKey}
            />
          );
        })}
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Briefcase,
  ShieldCheck,
  Sparkles,
  BadgeCheck,
} from "lucide-react";

import cmsApi from "@/services/cms";

export default function RegisterSection() {
  const router = useRouter();

  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchPlans();
  }, []);

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

  return (
    <section className="relative py-28 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* BACKGROUND BLOBS */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30" />

      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-200 rounded-full blur-3xl opacity-30" />

      <div className="max-w-4xl mx-auto px-6 text-center relative">
        {/* TITLE */}
        <div className="flex justify-center items-center gap-2 mb-4">
          <Sparkles className="text-blue-600" size={22} />

          <h2 className="text-4xl md:text-5xl font-bold">
            Get Started With Us
          </h2>
        </div>

        <p className="text-gray-600 text-lg mb-14 max-w-2xl mx-auto">
          Choose how you want to join — register as a customer to
          book trusted services or become a professional partner and
          grow your business.
        </p>

        {/* CTA BUTTONS */}
        <div className="flex flex-col md:flex-row gap-6 justify-center mb-16">
          <button
            onClick={() => router.push("/user_registration")}
            className="group flex items-center justify-center gap-3 px-10 py-6
            rounded-2xl text-white font-semibold text-lg
            bg-gradient-to-r from-blue-600 to-blue-500
            shadow-xl hover:shadow-2xl hover:-translate-y-1
            transition-all duration-300"
          >
            <UserPlus className="group-hover:scale-110 transition" />

            Customer Registration
          </button>

          <button
            onClick={() => router.push("/pathner_registration")}
            className="group flex items-center justify-center gap-3 px-10 py-6
            rounded-2xl text-white font-semibold text-lg
            bg-gradient-to-r from-orange-500 to-orange-400
            shadow-xl hover:shadow-2xl hover:-translate-y-1
            transition-all duration-300"
          >
            <Briefcase className="group-hover:scale-110 transition" />

            Become a Partner
          </button>
        </div>

        {/* PREMIUM INFO SECTION */}
        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="flex gap-3">
            <ShieldCheck className="text-blue-600 mt-1" />

            <div>
              <h4 className="font-semibold">Verified Platform</h4>

              <p className="text-sm text-gray-600">
                Secure onboarding with trusted users &
                professionals.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <BadgeCheck className="text-orange-500 mt-1" />

            <div>
              <h4 className="font-semibold">
                Premium Experience
              </h4>

              <p className="text-sm text-gray-600">
                Smooth modern interface built for performance.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Sparkles className="text-gray-700 mt-1" />

            <div>
              <h4 className="font-semibold">
                Fast Registration
              </h4>

              <p className="text-sm text-gray-600">
                Create your account in minutes and start
                instantly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PRICING SECTION */}
      <div className="mt-24 max-w-6xl mx-auto px-6 relative">
        <div className="text-center mb-14">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Partner Subscription Plans
          </h3>

          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan to grow your business and
            receive more customer leads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={plan._id || index}
              className={`relative rounded-3xl bg-white border shadow-lg p-8
              hover:shadow-2xl transition-all duration-300 hover:-translate-y-2
              ${plan.plan_key === "MODERN"
                  ? "border-orange-400 scale-105"
                  : "border-gray-100"
                }`}
            >
              {/* MOST POPULAR */}
              {/* {plan.plan_key === "MODERN" && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-sm font-semibold text-white bg-orange-500 shadow">
                    Most Popular
                  </span>
                </div>
              )} */}

              {/* PLAN TITLE */}
              <div
                className={`inline-flex px-4 py-2 rounded-xl text-white font-semibold mb-6
                ${plan.plan_key === "BASIC"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600"
                    : plan.plan_key === "MODERN"
                      ? "bg-gradient-to-r from-orange-400 to-orange-500"
                      : "bg-gradient-to-r from-purple-500 to-purple-600"
                  }`}
              >
                {plan.plan_name}
              </div>

              {/* PRICE */}
              <div className="mb-8">
                <span className="text-5xl font-bold">
                  ${plan.amount}
                </span>

                <span className="text-gray-500 ml-2">
                  /{plan.duration || "month"}
                </span>
              </div>

              {/* DESCRIPTION */}
              {plan.description && (
                <p className="text-gray-600 mb-6 text-sm">
                  {plan.description}
                </p>
              )}

              {/* FEATURES */}
              <ul className="space-y-4">
                {(Array.isArray(plan.features)
                  ? plan.features
                  : []
                ).map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <ShieldCheck
                        size={18}
                        className="text-green-500"
                      />
                    </div>

                    <span className="text-gray-700 text-sm break-words">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
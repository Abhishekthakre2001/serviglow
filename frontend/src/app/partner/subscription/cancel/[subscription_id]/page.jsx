
"use client";
export const runtime = "edge";

import { useRouter, useParams } from "next/navigation";
import { XCircle, ArrowRight } from "lucide-react";

export default function SubscriptionCancel() {
  const router = useRouter();
  const params = useParams();
  const subscriptionId = params.subscription_id;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white px-4">

      <div className="bg-white shadow-xl rounded-2xl p-10 max-w-md w-full text-center animate-fadeIn">

        {/* ❌ ICON */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-5 rounded-full">
            <XCircle size={60} className="text-red-600" />
          </div>
        </div>

        {/* TITLE */}
        <h1 className="text-2xl font-bold text-gray-800">
          Payment Cancelled
        </h1>

        {/* MESSAGE */}
        <p className="text-gray-500 mt-3">
          Your subscription payment was cancelled or not completed.
          You can try again anytime.
        </p>

        {/* SUBSCRIPTION ID */}
        {subscriptionId && (
          <div className="mt-5 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            Subscription ID:
            <div className="font-semibold text-gray-800 break-all">
              {subscriptionId}
            </div>
          </div>
        )}

        {/* BUTTON */}
        <button
          onClick={() =>
            router.replace("/partner/dashboard")
          }
          className="mt-8 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
        >
          Go to Dashboard
          <ArrowRight size={18} />
        </button>

      </div>

      {/* Animation */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

    </div>
  );
}
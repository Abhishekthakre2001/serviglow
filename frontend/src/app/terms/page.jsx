import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";

export default function TermsAndConditions() {
  return (
    <>
      <Navbar />
      <Breadcrumb title="Terms & Conditions" />

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Terms & Conditions
        </h1>

        <div className="space-y-6 text-gray-600 leading-7 text-lg">

          <p>
            Welcome to our platform. By booking any service through our website,
            you agree to the following terms and conditions. Please read them
            carefully before proceeding.
          </p>

          {/* 1 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              1. Service Booking
            </h2>
            <p>
              All services booked through our platform are subject to
              availability. Once confirmed, a service provider will be assigned
              to your request.
            </p>
          </div>

          {/* 2 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              2. Pricing & Payments
            </h2>
            <p>
              Prices may vary depending on the type of service and location.
              Payment must be completed before or after service as per selected
              payment method.
            </p>
          </div>

          {/* 3 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              3. Cancellation Policy
            </h2>
            <p>
              Users can cancel bookings before the scheduled time. Cancellation
              charges may apply depending on timing and service type.
            </p>
          </div>

          {/* 4 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              4. Service Responsibility
            </h2>
            <p>
              Service providers are responsible for delivering services. We act
              as a platform connecting users and service providers.
            </p>
          </div>

          {/* 5 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              5. User Responsibilities
            </h2>
            <p>
              Users must provide accurate information during booking. Any misuse
              or fraudulent activity may lead to account suspension.
            </p>
          </div>

          {/* 6 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              6. Refund Policy
            </h2>
            <p>
              Refunds are processed based on service issues and company policy.
              Refund timelines may vary depending on payment method.
            </p>
          </div>

          {/* 7 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              7. Limitation of Liability
            </h2>
            <p>
              We are not liable for any indirect damages or losses caused during
              service delivery.
            </p>
          </div>

          {/* 8 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              8. Changes to Terms
            </h2>
            <p>
              We reserve the right to update these terms at any time without
              prior notice.
            </p>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}
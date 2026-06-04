import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";

export default function PrivacyPolicy() {
    return (
        <>
            <Navbar />
            <Breadcrumb title="Privacy Policy" />

            <div className="max-w-4xl mx-auto px-6 py-16">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Privacy Policy
                </h1>

                <div className="space-y-6 text-gray-600 leading-7 text-lg">
                    <p>
                        We value your privacy and are committed to protecting your personal
                        information. This Privacy Policy explains how we collect, use,
                        store, and protect your data when you use our platform and book
                        services through our website.
                    </p>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            1. Information We Collect
                        </h2>
                        <p>
                            We may collect personal information such as your name, email
                            address, phone number, address, booking details, payment
                            information, and any other details you provide while using our
                            platform.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            2. How We Use Your Information
                        </h2>
                        <p>
                            Your information is used to process bookings, provide services,
                            improve user experience, communicate important updates, send
                            confirmations, and maintain the security of our platform.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            3. Sharing of Information
                        </h2>
                        <p>
                            We may share your information with service providers, payment
                            partners, and trusted third-party vendors only as necessary to
                            complete your booking and operate our services. We do not sell
                            your personal data.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            4. Data Security
                        </h2>
                        <p>
                            We implement reasonable security measures to protect your personal
                            data from unauthorized access, misuse, or disclosure. However, no
                            online platform can guarantee complete security.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            5. Cookies and Tracking
                        </h2>
                        <p>
                            We may use cookies and similar technologies to improve website
                            performance, remember user preferences, and analyze traffic for a
                            better experience.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            6. User Rights
                        </h2>
                        <p>
                            You may request access to, correction of, or deletion of your
                            personal information, subject to applicable laws and operational
                            requirements.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            7. Third-Party Links
                        </h2>
                        <p>
                            Our platform may contain links to third-party websites or services.
                            We are not responsible for the privacy practices or content of
                            those third-party sites.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            8. Changes to This Policy
                        </h2>
                        <p>
                            We may update this Privacy Policy from time to time. Any changes
                            will be posted on this page with the revised effective date.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            9. Contact Us
                        </h2>
                        <p>
                            If you have any questions about this Privacy Policy, you can
                            contact us through our official support channels.
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
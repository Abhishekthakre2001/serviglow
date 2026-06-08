"use client";

import { useEffect, useState } from "react";
import { Phone, Check } from "lucide-react";
import contactQuotationApi from "@/services/contactQuotation";
import Alert from "@/components/ui/Conformation";
import categoryApi from "../../services/category";
import cmsApi from "@/services/cms";

export default function ContactQuotationSection() {
  const [loading, setLoading] = useState(false);
  const [homeSection, setHomeSection] = useState(null);
  const [activeTab, setActiveTab] = useState("contact");
  const { createContact, createQuote } = contactQuotationApi;


  const nameRegex = /^[A-Za-z\s]+$/; // only letters + space
  const subjectRegex = /^[A-Za-z0-9\s.,!?'-]+$/; // allow readable text
  const emailRegex = /^\S+@\S+\.\S+$/;
  const phoneRegex = /^\+?[1-9]\d{0,3}[\s.-]?\(?\d{1,4}\)?([\s.-]?\d{1,4}){1,4}$/;


  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    whatsappNumber: "",
    subject: "",
    message: "",
  });

  const [quoteForm, setQuoteForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    requirement: "",
  });
  const [alertConfig, setAlertConfig] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
    onConfirm: null,
  });
  const handleContactChange = (field, value) => {
    setContactForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQuoteChange = (field, value) => {
    setQuoteForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleContactSubmit = async () => {
    try {
      // Name validation
      if (!contactForm.name.trim()) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Validation Error",
          message: "Full name is required",
        });
      }

      if (!nameRegex.test(contactForm.name)) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Invalid Name",
          message: "Name must contain only letters",
        });
      }

      // Email
      if (!contactForm.email.trim()) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Validation Error",
          message: "Email is required",
        });
      }

      if (!emailRegex.test(contactForm.email)) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Invalid Email",
          message: "Please enter a valid email address",
        });
      }

      // WhatsApp Number
      if (!contactForm.whatsappNumber.trim()) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Validation Error",
          message: "Phone number is required",
        });
      }

      if (!phoneRegex.test(contactForm.whatsappNumber)) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Invalid Number",
          message: "Enter a valid Phone number",
        });
      }

      // Subject
      if (!contactForm.subject.trim()) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Validation Error",
          message: "Subject is required",
        });
      }

      if (!subjectRegex.test(contactForm.subject)) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Invalid Subject",
          message: "Subject contains invalid characters",
        });
      }

      // Message
      if (!contactForm.message.trim() || contactForm.message.length < 5) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Validation Error",
          message: "Message must be at least 5 characters",
        });
      }


      setLoading(true);

      await createContact(contactForm);

      setAlertConfig({
        open: true,
        type: "success",
        title: "Message Sent",
        message: "Your message has been sent successfully.",
      });

      setContactForm({
        name: "",
        email: "",
        whatsappNumber: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setAlertConfig({
        open: true,
        type: "error",
        title: "Error",
        message: error?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleQuoteSubmit = async () => {
    try {
      if (!quoteForm.name.trim()) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Validation Error",
          message: "Name is required",
        });
      }

      if (!quoteForm.phone.trim()) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Validation Error",
          message: "Phone number is required",
        });
      }

      const phoneRegex = /^\+?[1-9]\d{0,3}[\s.-]?\(?\d{1,4}\)?([\s.-]?\d{1,4}){1,4}$/;
      if (!phoneRegex.test(quoteForm.phone)) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Invalid Phone",
          message: "Enter a valid 10-digit phone number",
        });
      }

      if (!quoteForm.email.trim()) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Validation Error",
          message: "Email is required",
        });
      }

      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(quoteForm.email)) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Invalid Email",
          message: "Please enter a valid email address",
        });
      }

      if (!quoteForm.service) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Validation Error",
          message: "Please select a service",
        });
      }

      if (!quoteForm.requirement.trim()) {
        return setAlertConfig({
          open: true,
          type: "error",
          title: "Validation Error",
          message: "Requirement description is required",
        });
      }

      setLoading(true);

      await createQuote(quoteForm);

      setAlertConfig({
        open: true,
        type: "success",
        title: "Quotation Requested",
        message: "Your quotation request has been submitted.",
      });

      setQuoteForm({
        name: "",
        phone: "",
        email: "",
        service: "",
        requirement: "",
      });
    } catch (error) {
      console.log("ERRORORRR", error);

      setAlertConfig({
        open: true,
        type: "error",
        title: "Error",
        message: error?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const [data, setData] = useState([]);

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getCategories();

      const formatted = res?.data?.data?.map((item) => ({
        id: item._id,
        categoryName: item.categoryName,
      }));
      setData(formatted);
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  const fetchHomeSection = async () => {
    try {
      const res = await cmsApi.getHomeSection();
      setHomeSection(res?.data?.data || {});
    } catch (error) {
      console.error("Error fetching home section", error);
    }
  };

  useEffect(() => {
    fetchHomeSection();
  }, []);
  useEffect(() => {
    fetchCategories();
  }, []);
  return (
    <>
      <Alert
        open={alertConfig.open}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, open: false }))}
        onConfirm={alertConfig.onConfirm}
      />
      <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-6">
          {/* ================= HEADING ================= */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block mb-4 px-4 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
              Need Help or Pricing?
            </span>

            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              Get in Touch or Request a
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">
                Free Service Quotation
              </span>
            </h2>

            <p className="mt-6 text-lg text-gray-600">
              Whether you have questions or want an exact price for your
              service, our team is here to help you quickly and transparently.
            </p>
          </div>

          {/* ================= GRID ================= */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* LEFT INFO */}
            <div className="space-y-8">
              <div className="bg-white rounded-3xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {homeSection?.whyChooseUs?.heading
                    ? homeSection?.whyChooseUs?.heading
                    : "Why Choose Us?"}
                </h3>

                <ul className="space-y-4 text-gray-600">
                  {homeSection?.whyChooseUs?.points?.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-blue-600">✔</span>
                      {item.text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-3xl p-8 text-white shadow-lg">
                <h4 className="text-xl font-bold mb-2">
                  {homeSection?.quickSupport?.heading || "Quick Support"}
                </h4>

                <p className="opacity-90">
                  {homeSection?.quickSupport?.description}
                </p>

                <p className="mt-4 font-semibold text-lg flex items-center gap-2">
                  <Phone className="h-6" />
                  {homeSection?.quickSupport?.phoneNumber}
                </p>
              </div>
            </div>

            {/* RIGHT FORM */}
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              {/* TABS */}
              <div className="flex  rounded-full">
                {/* <button
                  onClick={() => setActiveTab("contact")}
                  className={`flex-1 py-3 rounded-full font-semibold transition
                  ${activeTab === "contact"
                      ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white"
                      : "text-gray-600 hover:bg-white"
                    }`}
                >
                  Contact Us
                </button> */}

                {/* <button
                  onClick={() => setActiveTab("quote")}
                  className={`flex-1 py-3 rounded-full font-semibold transition
                  ${
                    activeTab === "quote"
                      ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white"
                      : "text-gray-600 hover:bg-white"
                  }`}
                >
                  Get a Quote
                </button> */}
              </div>

              {/* CONTACT FORM */}
              {activeTab === "contact" && (
                <div className="space-y-5 animate-fadeUp">
                  {/* Contact Form Header */}
                  <div className="text-center">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">

                      <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500">
                        Contact Us
                      </span>
                    </h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      value={contactForm.name}
                      onChange={(e) =>
                        handleContactChange("name", e.target.value)
                      }
                      placeholder="Full Name"
                      className="p-4 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      value={contactForm.email}
                      onChange={(e) =>
                        handleContactChange("email", e.target.value)
                      }
                      placeholder="Email Address"
                      className="p-4 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-1 gap-4">
                    <input
                      value={contactForm.whatsappNumber}
                      onChange={(e) =>
                        handleContactChange("whatsappNumber", e.target.value)
                      }
                      placeholder="Phone Number"
                      className="p-4 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-1 gap-4">
                    <input
                      value={contactForm.subject}
                      onChange={(e) =>
                        handleContactChange("subject", e.target.value)
                      }
                      placeholder="Subject"
                      className="p-4 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-1 gap-4">
                    <textarea
                      placeholder="Your Message"
                      rows="4"
                      value={contactForm.message}
                      onChange={(e) =>
                        handleContactChange("message", e.target.value)
                      }
                      className="p-4 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleContactSubmit}
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 text-white font-semibold shadow-lg hover:scale-105 transition"
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </button>
                </div>
              )}

              {/* QUOTE FORM */}
              {activeTab === "quote" && (
                <div className="space-y-5 animate-fadeUp">
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      value={quoteForm.name}
                      onChange={(e) =>
                        handleQuoteChange("name", e.target.value)
                      }
                      placeholder="Full Name"
                      className="p-4 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      value={quoteForm.phone}
                      onChange={(e) =>
                        handleQuoteChange("phone", e.target.value)
                      }
                      placeholder="Phone Number"
                      className="p-4 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      value={quoteForm.email}
                      onChange={(e) =>
                        handleQuoteChange("email", e.target.value)
                      }
                      placeholder="Enter Email"
                      className="p-4 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={quoteForm.service}
                      onChange={(e) =>
                        handleQuoteChange("service", e.target.value)
                      }
                      className="p-4 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Service</option>

                      {data?.map((item) => (
                        <option key={item?.id} value={item?.id}>
                          {item?.categoryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid md:grid-cols-1 gap-4">
                    <textarea
                      value={quoteForm.requirement}
                      onChange={(e) =>
                        handleQuoteChange("requirement", e.target.value)
                      }
                      rows="4"
                      placeholder="Describe your requirement"
                      className="p-4 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleQuoteSubmit}
                    disabled={loading}
                    className="w-full py-4 rounded-xl
             bg-gradient-to-r from-blue-600 to-orange-500
             text-white font-semibold shadow-lg
             hover:scale-105 transition"
                  >
                    {loading ? "Submitting..." : "Request Quotation"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

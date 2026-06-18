"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import FooterContent from "@/components/ui/Footer";
import cmsApi from "@/services/cms";
import Alert from "@/components/ui/Conformation";
import HomeSectionContent from "@/components/ui/HomeSection";
import BannerContent from "@/components/ui/Banner";
import PoliciesManager from "@/components/ui/Policies";
import Announcement from "@/components/ui/Announcement";
// import DymanicPriceing from "@/components/ui/DymanicPriceing";
import BookingTerms from "@/components/ui/BookingTerms";
import PagesCMS from "@/components/ui/PagesCMS";


/* ================= TABS ================= */
const TABS = [
  { key: "Home Banner", label: "Home Banner" },
  { key: "why", label: "Why Choose Us" },
  { key: "footer", label: "Footer" },
  { key: "policies", label: "Policies" },
  { key: "announcement", label: "Announcement" },
  // { key: "priceing", label: "Priceing" },
  { key: "Bookingt&c", label: "Booking T&c " },
  { key: "Pages", label: "Pages" },
];
const isValidURL = (url) => {
  if (!url) return false;

  // allow internal routes
  if (
    url.startsWith("/") ||
    url.startsWith("#")
  ) {
    return true;
  }

  // allow full URLs
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
export default function Content() {
  const [activeTab, setActiveTab] = useState("Home Banner");

  const [footerData, setFooterData] = useState(null);
  const [loading, setLoading] = useState(false);

  /* 🔔 ALERT STATE */
  const [alert, setAlert] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  /* ================= FETCH FOOTER ================= */
  const [contentData, setContentData] = useState({
    footer: null,
    homeSection: null,
    banner: null,
  });

  const fetchContent = async () => {
    try {
      setLoading(true);

      const [footerRes, homeRes, bannerRes] = await Promise.all([
        cmsApi.getFooter(),
        cmsApi.getHomeSection(),
        cmsApi.getBanner(),
      ]);

      setContentData({
        footer: footerRes?.data?.data || {},
        homeSection: homeRes?.data?.data || {},
        banner: bannerRes?.data?.data || {},
      });

    } catch (error) {
      setAlert({
        open: true,
        type: "error",
        title: "Error",
        message: "Failed to load content data",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  /* ================= SAVE FOOTER ================= */
  const handleSaveFooter = async (data) => {
    const showError = (message) =>
      setAlert({
        open: true,
        type: "error",
        title: "Validation Error",
        message,
      });

    const isValidEmail = (email) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // const isValidPhone = (phone) =>
    //   /^[6-9]\d{9}$/.test(phone);

    const validateLinks = (arr, type) => {
      for (let item of arr || []) {
        if (!item.label || !item.link) {
          return `${type} must have label and URL`;
        }
        if (!isValidURL(item.link)) {
          return `Invalid URL in ${type} (${item.label})`;
        }
      }
      return null;
    };

    const validateSocials = (arr) => {
      for (let item of arr || []) {
        if (!item.platform || !item.link) {
          return "Social links must have platform and URL";
        }
        if (!isValidURL(item.link)) {
          return `Invalid URL in Social Links (${item.platform})`;
        }
      }
      return null;
    };

    try {
      // ================= VALIDATION =================

      const checks = [
        () => !data?.company?.name?.trim() && "Company name is required",
        () =>
          !data?.company?.description?.trim() &&
          "Company description is required",
        () =>
          data?.company?.logo &&
          !isValidURL(data.company.logo) &&
          "Invalid company logo URL",

        // () => !data?.contact?.phone?.trim() && "Phone number is required",
        // () =>
        //   data?.contact?.phone &&
        //   !isValidPhone(data.contact.phone) &&
        //   "Invalid phone number",

        () => !data?.contact?.email?.trim() && "Email is required",
        () =>
          data?.contact?.email &&
          !isValidEmail(data.contact.email) &&
          "Invalid email format",

        // () =>
        //   data?.highlights?.length > 5 &&
        //   "Maximum 5 highlights allowed",

        () => validateLinks(data?.quickLinks, "Quick Links"),
        () => validateSocials(data?.company?.socials),
        () => validateLinks(data?.bottom?.links, "Bottom Links"),
      ];

      for (let check of checks) {
        const error = check();
        if (error) return showError(error);
      }

      // ================= API CALL =================

      setLoading(true);

      const res = await cmsApi.upsertFooter(data);

      setAlert({
        open: true,
        type: "success",
        title: "Success",
        message: res?.data?.message || "Footer saved successfully",
      });

      fetchContent()
    } catch (error) {
      console.log("E", error)
      setAlert({
        open: true,
        type: "error",
        title: "Error",
        message:
          error?.response?.data?.message ||
          "Something went wrong while saving",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleSaveHomeSection = async (data) => {
    const showError = (message) =>
      setAlert({
        open: true,
        type: "error",
        title: "Validation Error",
        message,
      });

    const isValidColor = (color) =>
      /^#([0-9A-F]{3}){1,2}$/i.test(color);

    const isValidPhone = (phone) =>
      /^[+]?[\d\s-]{10,15}$/.test(phone);

    try {
      // ================= VALIDATION =================

      const checks = [
        // WHY CHOOSE US
        () =>
          !data?.whyChooseUs?.heading?.trim() &&
          "Why Choose Us heading is required",

        () =>
          data?.whyChooseUs?.points?.length === 0 &&
          "At least one point is required",

        () =>
          data?.whyChooseUs?.points?.some(
            (p) => !p.text?.trim()
          ) && "All points must have text",



        // QUICK SUPPORT
        () =>
          !data?.quickSupport?.heading?.trim() &&
          "Quick Support heading is required",

        () =>
          !data?.quickSupport?.description?.trim() &&
          "Quick Support description is required",

        () =>
          data?.quickSupport?.phoneNumber &&
          !isValidPhone(data.quickSupport.phoneNumber) &&
          "Invalid phone number",




      ];

      for (let check of checks) {
        const error = check();
        if (error) return showError(error);
      }

      // ================= API CALL =================

      setLoading(true);

      const res = await cmsApi.upsertHomeSection(data);

      setAlert({
        open: true,
        type: "success",
        title: "Success",
        message: res?.data?.message || "Home section saved",
      });

      fetchContent();

    } catch (error) {
      setAlert({
        open: true,
        type: "error",
        title: "Error",
        message:
          error?.response?.data?.message ||
          "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBanner = async (data) => {
    const showError = (message) =>
      setAlert({
        open: true,
        type: "error",
        title: "Validation Error",
        message,
      });

    // ================= CLEAN DATA FIRST =================
    const cleanedCounters =
      data?.counters?.map((c) => ({
        number: (c.number || "")
          .toString()
          .replace(/[^0-9kK+]/g, ""), // remove invalid chars

        title: (c.title || "").trim(),
      })) || [];

    // ================= VALIDATION =================

    const checks = [
      () =>
        !cleanedCounters.length &&
        "At least one counter is required",

      () =>
        cleanedCounters.some(
          (c) => !c.number || !c.title
        ) && "All counters must have valid number and title",

      // () =>
      //   cleanedCounters.some(
      //     (c) => !/^[0-9]+(k|K|\+)?$/.test(c.number)
      //   ) && "Number must start with digits (e.g. 10, 10K, 10+)",
    ];

    for (let check of checks) {
      const error = check();
      if (error) return showError(error);
    }

    try {
      // ================= API CALL =================

      setLoading(true);

      const res = await cmsApi.upsertbanner({
        counters: cleanedCounters,
      });

      setAlert({
        open: true,
        type: "success",
        title: "Success",
        message: res?.data?.message || "Banner saved successfully",
      });

      fetchContent();

    } catch (error) {
      console.log("E", error);

      setAlert({
        open: true,
        type: "error",
        title: "Error",
        message:
          error?.response?.data?.message ||
          "Something went wrong",
      });

    } finally {
      setLoading(false);
    }
  };
  /* ================= UI ================= */

  return (
    <AdminLayout>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* 🔔 ALERT */}
        <Alert
          open={alert.open}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() =>
            setAlert((prev) => ({ ...prev, open: false }))
          }
        />

        {/* MAIN CARD */}
        <div className="bg-white rounded-2xl shadow-sm w-full overflow-hidden">

          {/* HEADER */}
          <div className="px-5 sm:px-6 py-4  bg-gray-50">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
              Content Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage all dynamic sections of your website
            </p>
          </div>

          {/* TABS */}
          <div className="px-5 sm:px-6 py-4  bg-white">
            <div className="flex flex-wrap justify-between gap-3 bg-gray-100 p-2 rounded-2xl">

              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-2 rounded-xl text-base font-semibold transition-all duration-200 ${activeTab === tab.key
                    ? "bg-white text-blue-600 shadow-md scale-[1.02]"
                    : "text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                    }`}
                >
                  {tab.label}
                </button>
              ))}

            </div>
          </div>

          {/* CONTENT */}
          <div className="p-4 sm:p-6 lg:p-8">


            {/* HERO */}
            {activeTab === "Home Banner" && (
              loading && !contentData?.banner ? (
                <div className="text-center py-10 text-gray-400">
                  Loading Banner...
                </div>
              ) : (
                <BannerContent
                  initialData={contentData?.banner || {}}
                  onSave={handleSaveBanner}
                  loading={loading}

                />
              )
            )}

            {/* WHY */}

            {activeTab === "why" && (
              loading && !contentData?.homeSection ? (
                <div className="text-center py-10 text-gray-400">
                  Loading footer...
                </div>
              ) : (
                <HomeSectionContent
                  initialData={contentData?.homeSection || {}}
                  onSave={handleSaveHomeSection}
                  loading={loading}

                />
              )
            )}
            {/* FOOTER */}
            {activeTab === "footer" && (
              loading && !contentData?.footer ? (
                <div className="text-center py-10 text-gray-400">
                  Loading footer...
                </div>
              ) : (
                <FooterContent
                  initialData={contentData?.footer || {}}
                  onSave={handleSaveFooter}
                  loading={loading}
                />
              )
            )}
            {/* policys */}
            {activeTab === "policies" && (
              loading && !contentData?.footer ? (
                <div className="text-center py-10 text-gray-400">
                  Loading footer...
                </div>
              ) : (
                <PoliciesManager

                />
              )
            )}

            {/* policys */}
            {activeTab === "announcement" && (
              loading && !contentData?.footer ? (
                <div className="text-center py-10 text-gray-400">
                  Loading footer...
                </div>
              ) : (
                <Announcement

                />
              )
            )}

            {/* {activeTab === "priceing" && (
              <DymanicPriceing />
            )} */}

            {activeTab === "Bookingt&c" && (
              <BookingTerms />
            )}

            {activeTab === "Pages" && (
              <PagesCMS />
            )}

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
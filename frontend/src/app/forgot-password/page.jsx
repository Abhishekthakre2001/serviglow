"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ForgotPasswordPage from "../Websites/forgot-password";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";

export default function ForgotPassword() {
  return (
    <>
      <Navbar />
      <Breadcrumb />
      <ForgotPasswordPage />
      <Footer />
    </>
  );
}
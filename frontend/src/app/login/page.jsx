"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import LoginPage from "../Websites/Login";
import Footer from "@/components/layout/Footer";
import Breadcrumb from "@/components/ui/Breadcrumb";

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("IS_LOGGED_IN") === "true";
    const role = localStorage.getItem("ROLE");

    if (isLoggedIn && role) {
      switch (role) {
        case "customer":
          router.replace("/"); // or "/Users/mybooking"
          break;

        case "partner":
          router.replace("/partner/dashboard");
          break;

        case "admin":
        case "superadmin":
          router.replace("/admin/dashboard");
          break;

        default:
          router.replace("/");
      }
    }
  }, []);

  return (
    <>
      <Navbar />
      <Breadcrumb />
      <LoginPage />
      <Footer />
    </>
  );
}
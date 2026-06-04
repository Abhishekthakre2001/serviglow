"use client";

import React, { useState } from "react";
import Websites from "./Websites/page";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Loading from "@/components/ui/loading";

export default function Page() {

  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && <Loading />}

      <Navbar />

      <Websites setPageLoading={setLoading} />

      <Footer />
    </>
  );
}
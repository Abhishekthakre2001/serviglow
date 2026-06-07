"use client";

import React, { useEffect, useState } from 'react';

import Services_Listing from './ServicesCategory';
import HeroSection from './HeroSection';
import ReviewsSection from './ReviewSection';
import ContactSection from './ContactSection';
import CounterSection from "@/components/ui/CounterSection";

export default function Index({ setPageLoading }) {

  useEffect(() => {
    loadPage();
  }, []);

  const loadPage = async () => {

    try {

      // wait a little if child components fetch APIs internally
      await Promise.all([
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);

    } catch (error) {

      console.log(error);

    } finally {

      setPageLoading(false);

    }
  };

  const [zipCode, setZipCode] = useState("");

  return (
    <>
      <HeroSection
        zipCode={zipCode}
        setZipCode={setZipCode}
      />
      <CounterSection />
      <Services_Listing
        zipCode={zipCode}
      />
      <ReviewsSection />
      <ContactSection />
    </>
  );
}
"use client";

import React, { useEffect } from 'react';

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

  return (
    <>
      <HeroSection />
      <CounterSection />
      <Services_Listing />
      <ReviewsSection />
      <ContactSection />
    </>
  );
}
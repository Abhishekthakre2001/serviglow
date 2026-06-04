import React from 'react';
import Navbar from '@/components/layout/Navbar';
import ReviewsSection from '../Websites/ReviewSection';  
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function Review() {
  return (
    <>
    <Navbar />
    <Breadcrumb />
    <ReviewsSection />
    <Footer />
    </>
  )
}

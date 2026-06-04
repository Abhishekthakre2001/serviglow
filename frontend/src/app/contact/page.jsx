import React from 'react';
import Navbar from '@/components/layout/Navbar';
import ContactQuotationSection from '../Websites/ContactSection';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function Contact() {
  return (
    <>
      <Navbar />
      <Breadcrumb />
      <ContactQuotationSection />
      <Footer />
    </>

  )
}

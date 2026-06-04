import React from 'react';
import Navbar from '@/components/layout/Navbar';
import ServicesPremium from '../Websites/ServicesCategory';
import Footer from '@/components/layout/Footer';   
import Breadcrumb from '@/components/ui/Breadcrumb'; 

export default function Services() {
  return (
  <>
  <Navbar />
  <Breadcrumb />
  <ServicesPremium />
  <Footer />
  </>
  )
}

export const runtime = "edge";

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import BookingServiceForm from '../../Websites/Booking';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function Booking() {
  return (
   <>
   <Navbar />
   <Breadcrumb />
   <BookingServiceForm />
   <Footer />
   </>
  )
}

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Registration from '../Websites/Registration';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function RegistrationPage() {
  return (
    <>
    <Navbar />
    <Breadcrumb />
    <Registration />
    <Footer />
    </>
  )
}

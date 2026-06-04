import React from 'react';
import Navbar from '@/components/layout/Navbar';
import PathnerRegistration from '../Websites/PathnerRegistration';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function PathnerRegistrationPage() {
    return (
        <>
            <Navbar />
            <Breadcrumb />
            <PathnerRegistration />
            <Footer />
        </>

    )
}

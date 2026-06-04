import React from 'react';
import Navbar from '@/components/layout/Navbar';
import UserRegistrationPage from '../Websites/UserRegistration';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/ui/Breadcrumb';

export default function UserRegistration() {
    return (
        <>
            <Navbar />
            <Breadcrumb />
            <UserRegistrationPage />
            <Footer />
        </>

    )
}

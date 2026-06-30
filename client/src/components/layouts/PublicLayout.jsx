import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';

const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Sticky Top Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Spacious Footer */}
      <Footer />
    </div>
  );
};

export default PublicLayout;

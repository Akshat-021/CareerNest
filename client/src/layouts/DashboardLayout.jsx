import React, { useState, useEffect } from 'react';
import { Sidebar, TopNavbar } from '../components/navigation';

/**
 * DashboardLayout
 * Unifies the grouped 5-domain Sidebar, Universal TopNavbar,
 * Notification Center, Global Search, and Accessible Mobile Navigation Drawer.
 */
const DashboardLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen flex bg-brand-light dark:bg-brand-dark transition-colors duration-300">
      {/* SKIP TO MAIN CONTENT LINK FOR KEYBOARD ACCESSIBILITY */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* DESKTOP SIDEBAR (FIXED LG) */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-40 w-64">
        <Sidebar />
      </div>

      {/* MOBILE SIDEBAR DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div
          role="presentation"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fadeIn"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Drawer"
            onClick={(e) => e.stopPropagation()}
            className="w-64 max-w-[80vw] h-full shadow-2xl animate-slideRight"
          >
            <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 lg:pl-64 min-w-0 flex flex-col min-h-screen">
        {/* UNIVERSAL TOP NAVBAR */}
        <TopNavbar onMobileMenuToggle={() => setMobileMenuOpen(true)} />

        {/* PAGE CONTENT CONTAINER */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

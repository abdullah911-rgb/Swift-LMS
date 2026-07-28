import React from 'react';
import { motion } from 'framer-motion';
import {
  IoRocketOutline,
  IoNotificationsOutline,
} from 'react-icons/io5';

const FinanceSoftwarePage = () => {
  return (
    <div className="font-sans bg-white min-h-screen">

      {/* ── Hero Section ── */}
      <section className="relative bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-accent-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Coming Soon Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-400/20 border border-accent-400/40 text-accent-300 text-xs font-bold tracking-widest uppercase mb-6">
              <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
              Coming Soon
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold leading-tight mb-6">
              Swift <span className="text-accent-400">Finance</span> Software
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
              A powerful, integrated financial management platform purpose-built for Swift Institute of Safety & Technology. 
              Streamline fees, payroll, expenses, and reporting — all in one place.
            </p>

            <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 text-sm text-slate-200">
              <IoRocketOutline size={20} className="text-accent-400 shrink-0" />
              <span>This software is currently under development and will be integrated with the LMS platform in the near future.</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Timeline / Status Banner ── */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 mb-6">
            <IoRocketOutline size={32} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
            We're Working Hard on It
          </h2>
          <p className="text-slate-500 text-base max-w-2xl mx-auto leading-relaxed mb-8">
            The Swift Finance Software is currently in active development. Our team is building a robust, secure, 
            and seamlessly integrated financial solution that will be rolled out as part of the Swift Institute platform.
            Stay tuned for the official launch announcement.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-semibold">
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-green-50 border border-green-100 text-green-700">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              LMS Platform — Live
            </div>
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Finance Software — In Development
            </div>
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Full Integration — Coming Soon
            </div>
          </div>
        </div>
      </section>

      {/* ── Notify Me Section ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
          Be the First to Know
        </h2>
        <p className="text-slate-500 text-base max-w-lg mx-auto mb-8">
          We'll announce the launch of Swift Finance Software through our platform. 
          Keep an eye on your notifications and announcements board for updates.
        </p>
        <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-primary-600 text-white font-semibold text-sm shadow-md shadow-primary-200">
          <IoNotificationsOutline size={18} />
          Watch for announcements on your portal dashboard
        </div>
      </section>

    </div>
  );
};

export default FinanceSoftwarePage;

import React from 'react';
import Card from '../../components/ui/Card';
import { IoCheckmarkCircleSharp, IoStarSharp } from 'react-icons/io5';

const AboutPage = () => {
  return (
    <div className="py-16 sm:py-24 bg-slate-50/30 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Title / Intro */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full">Our Story</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-slate-900 leading-none">
            Empowering Minds Globally
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
            We build tools to make premium technology and design education accessible, structured, and immersive.
          </p>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-bold text-slate-950">A Premium LMS Ecosystem</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Unlike generic platforms with unverified slides, our LMS centers around structured curriculum modules. We connect Students directly with Instructors using live classrooms, downloadable resources, tracking metrics, and certificates.
            </p>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-2.5 text-slate-600 text-sm font-semibold">
                <IoCheckmarkCircleSharp className="text-primary-500 mt-0.5 flex-shrink-0" size={18} />
                <span>Zoom SDK-powered in-browser video classrooms</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-600 text-sm font-semibold">
                <IoCheckmarkCircleSharp className="text-primary-500 mt-0.5 flex-shrink-0" size={18} />
                <span>Strict lesson-level progress metrics</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-600 text-sm font-semibold">
                <IoCheckmarkCircleSharp className="text-primary-500 mt-0.5 flex-shrink-0" size={18} />
                <span>Secure, blockchain-verifiable certificates</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-tr from-primary-600 to-primary-500 rounded-3xl p-8 text-white relative shadow-xl overflow-hidden aspect-video flex flex-col justify-end">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent)]"></div>
            <IoStarSharp size={48} className="text-primary-200/20 absolute top-8 right-8" />
            <h3 className="text-xl font-heading font-bold">100% Student-First Focus</h3>
            <p className="text-xs text-primary-100 mt-1 font-light leading-relaxed">
              We continually iterate on curriculum feedback and design clean interfaces, keeping the learning experience smooth.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;

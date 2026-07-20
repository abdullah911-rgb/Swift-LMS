import React from 'react';
import Card from '../../components/ui/Card';
import { IoCheckmarkCircleSharp, IoStarSharp } from 'react-icons/io5';

const AboutPage = () => {
  return (
    <div className="py-16 sm:py-24 bg-slate-50/30 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Title / Intro */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-accent-700 bg-accent-50 px-3 py-1 rounded-full mb-3">Our Profile</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-primary-950 leading-tight">
            Swift Institute of Safety & Technology
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
            Pakistan's leading platform for international safety certifications and advanced industrial technology training.
          </p>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-bold text-primary-900">Industry-Standard Professional Ecosystem</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              We provide structured training programs designed to keep workplaces safe and build tech-savvy professionals. Our custom LMS integrates live lectures, downloadable manuals, and automated validation features to guarantee optimal learning outcomes.
            </p>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-2.5 text-slate-600 text-sm font-semibold">
                <IoCheckmarkCircleSharp className="text-accent-500 mt-0.5 flex-shrink-0" size={18} />
                <span>Live virtual classroom mentoring sessions</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-600 text-sm font-semibold">
                <IoCheckmarkCircleSharp className="text-accent-500 mt-0.5 flex-shrink-0" size={18} />
                <span>Downloadable safety manuals & course exercises</span>
              </li>
              <li className="flex items-start gap-2.5 text-slate-600 text-sm font-semibold">
                <IoCheckmarkCircleSharp className="text-accent-500 mt-0.5 flex-shrink-0" size={18} />
                <span>Internationally recognized verifiable completion certificates</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-tr from-primary-900 to-primary-750 rounded-3xl p-8 text-white relative shadow-xl overflow-hidden aspect-video flex flex-col justify-end">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.1),transparent)]"></div>
            <IoStarSharp size={48} className="text-accent-400/20 absolute top-8 right-8" />
            <h3 className="text-xl font-heading font-bold text-accent-400">100% Practical Focus</h3>
            <p className="text-xs text-primary-100 mt-1 font-light leading-relaxed">
              We continually iterate on course outlines based on real-world industrial guidelines, ensuring compliance and cutting-edge skillset delivery.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;

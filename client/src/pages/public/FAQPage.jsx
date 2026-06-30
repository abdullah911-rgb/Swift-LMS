import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import { IoChevronDownOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

const FAQPage = () => {
  const faqs = [
    {
      question: 'How do I join a live Zoom meeting class?',
      answer: 'Once enrolled in a course with live classes, a notification and link will appear on your Student Portal under "Upcoming Live Classes". You can join the session directly inside the platform without needing separate login links.'
    },
    {
      question: 'Are there system requirements for downloadable materials?',
      answer: 'No. Downloadable resources are primarily standard PDF format slides, templates, or zip files that can be opened on any modern mobile device or laptop computer.'
    },
    {
      question: 'How is my course progress calculated?',
      answer: 'Your progress percentage updates automatically as you click "Complete Lesson" or finish watching course videos. You can track this on your portfolio course dashboard.'
    },
    {
      question: 'Are completion certificates verifiable?',
      answer: 'Yes! Every certificate generated has a unique verification code that employers can check on the public website to verify its validity.'
    },
    {
      question: 'Can I get a refund if I am unsatisfied?',
      answer: 'We offer a 14-day refund policy for paid courses if the student progress is below 15% of the total lessons. Contact support for requests.'
    }
  ];

  const [activeIndex, setActiveIndex] = useState(null);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="py-16 sm:py-24 bg-slate-50/30 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Title */}
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full">Support Centre</span>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-slate-900 leading-none">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Find answers to common questions about accounts, zoom classes, and verification.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeIndex === index;
            return (
              <Card key={index} hover={false} className="p-0 border border-slate-100 overflow-hidden bg-white">
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-slate-800 hover:bg-slate-50/50 transition-all outline-none cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-heading font-semibold">{faq.question}</span>
                  <IoChevronDownOutline 
                    className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ml-4 ${isOpen ? 'rotate-180 text-primary-600' : ''}`} 
                    size={18}
                  />
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-6 text-xs sm:text-sm text-slate-450 leading-relaxed border-t border-slate-50 pt-4 bg-slate-50/20 text-slate-500">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default FAQPage;

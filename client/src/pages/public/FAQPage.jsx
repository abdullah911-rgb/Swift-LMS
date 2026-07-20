import React, { useState } from 'react';
import Card from '../../components/ui/Card';
import { IoChevronDownOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';

const FAQPage = () => {
  const faqs = [
    {
      question: 'How do I join the live online sessions?',
      answer: 'Once enrolled in a SWIFT program, a join link will appear in your Student Portal under the "Live Zoom Classes" tab for that course at the scheduled class time. You can launch the virtual classroom directly from our portal.'
    },
    {
      question: 'Can I access the training manuals offline?',
      answer: 'Yes! All modules include downloadable slide decks, safety checklists, and reference guides in PDF format, which you can save to study offline.'
    },
    {
      question: 'How is syllabus progress calculated?',
      answer: 'Your progress percentage increases automatically as you mark lessons completed in the course view. Once it reaches 100%, you can generate your certificate.'
    },
    {
      question: 'Are Swift Institute certificates internationally recognized?',
      answer: 'Yes. Our certificates are issued with unique verification codes that organizations can check on our public website to verify registration details and skills validation.'
    },
    {
      question: 'Who should enroll in safety and tech programs?',
      answer: 'Our courses are tailored for engineers, safety officers, supervisors, technicians, and students looking to comply with industrial safety standards or gain advanced technical skills.'
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
          <span className="text-xs font-bold uppercase tracking-wider text-accent-700 bg-accent-50 px-3 py-1 rounded-full">FAQ Center</span>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-primary-950 leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Find answers to common questions about enrollment, certification, and training formats at SWIFT.
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
                  className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-slate-800 hover:bg-slate-50/50 transition-all outline-none cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-heading font-semibold">{faq.question}</span>
                  <IoChevronDownOutline 
                    className={`text-slate-450 transition-transform duration-200 flex-shrink-0 ml-4 ${isOpen ? 'rotate-180 text-accent-600' : ''}`} 
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
                      <div className="px-6 pb-6 text-xs sm:text-sm leading-relaxed border-t border-slate-50 pt-4 bg-slate-50/20 text-slate-500">
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

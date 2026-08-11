import React from 'react';
import { motion } from 'framer-motion';
import { IoNewspaperOutline, IoCalendarOutline, IoArrowForwardOutline, IoBookOutline, IoRibbonOutline, IoPeopleOutline } from 'react-icons/io5';

const newsItems = [
  {
    id: 1,
    category: 'Course Launch',
    categoryColor: '#6366f1',
    categoryBg: '#eef2ff',
    icon: <IoBookOutline size={22} />,
    date: 'August 10, 2026',
    title: 'New NEBOSH International General Certificate Course Now Available',
    summary:
      'Swift Institute is proud to announce the launch of the highly anticipated NEBOSH IGC program. This internationally recognised qualification covers all aspects of occupational health and safety management and is ideal for safety officers, engineers, and supervisors across all industries.',
    badge: 'New',
    badgeColor: '#059669',
    badgeBg: '#d1fae5',
    author: 'Swift Admin',
  },
  {
    id: 2,
    category: 'Platform Update',
    categoryColor: '#0891b2',
    categoryBg: '#e0f2fe',
    icon: <IoNewspaperOutline size={22} />,
    date: 'August 5, 2026',
    title: 'Student Portal Upgrade — Live Zoom Integration & Progress Tracking Enhanced',
    summary:
      'We have rolled out a major upgrade to the Swift LMS student portal. Students can now join live Zoom sessions directly from the course dashboard, track syllabus completion in real time, and access downloadable materials in a redesigned resource library. The new quiz module also supports automated grading and instant feedback.',
    badge: 'Update',
    badgeColor: '#0891b2',
    badgeBg: '#e0f2fe',
    author: 'Tech Team',
  },
  {
    id: 3,
    category: 'Certification',
    categoryColor: '#d97706',
    categoryBg: '#fef3c7',
    icon: <IoRibbonOutline size={22} />,
    date: 'July 28, 2026',
    title: 'Swift Institute Certificates Now Feature Blockchain-Verified QR Codes',
    summary:
      'Effective immediately, all certificates issued by Swift Institute of Safety & Technology carry a unique blockchain-backed verification QR code. Employers and organisations can instantly verify a certificate\'s authenticity by scanning the QR code or entering the unique code at our public verification portal at swiftinstitute.edu.pk/verify.',
    badge: 'Announcement',
    badgeColor: '#d97706',
    badgeBg: '#fef3c7',
    author: 'Certification Board',
  },
  {
    id: 4,
    category: 'Events',
    categoryColor: '#7c3aed',
    categoryBg: '#ede9fe',
    icon: <IoPeopleOutline size={22} />,
    date: 'July 20, 2026',
    title: 'Free Webinar: Safety Culture in the Workplace — Register Now',
    summary:
      'Join us for a free, interactive webinar on building a proactive safety culture within your organisation. The session will be hosted by our lead safety instructors and will cover risk assessment frameworks, incident prevention strategies, and how to prepare for NEBOSH & IOSH examinations. Open to all registered students and professionals.',
    badge: 'Free Event',
    badgeColor: '#7c3aed',
    badgeBg: '#ede9fe',
    author: 'Events Team',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.1, ease: 'easeOut' },
  }),
};

const NewsAndUpdatesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/50 font-sans">

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-900 text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(201,162,39,0.18),transparent)]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent-500/20 text-accent-300 text-xs font-bold uppercase tracking-widest">
            Swift Institute
          </span>
          <h1 className="text-4xl sm:text-5xl font-heading font-extrabold tracking-tight leading-tight">
            News &amp; Updates
          </h1>
          <p className="text-primary-200 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Stay up to date with the latest course launches, platform improvements, certification news, and upcoming events from Swift Institute of Safety &amp; Technology.
          </p>
        </div>
      </div>

      {/* News Cards */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-8">

        {newsItems.map((item, i) => (
          <motion.article
            key={item.id}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={cardVariants}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
          >
            {/* Top coloured accent bar */}
            <div
              className="h-1.5 w-full"
              style={{ background: `linear-gradient(90deg, ${item.categoryColor}, ${item.categoryColor}88)` }}
            />

            <div className="p-7 sm:p-8">
              {/* Meta Row */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {/* Category chip */}
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ color: item.categoryColor, background: item.categoryBg }}
                >
                  {item.icon}
                  {item.category}
                </span>

                {/* Badge */}
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: item.badgeColor, background: item.badgeBg }}
                >
                  {item.badge}
                </span>

                {/* Date */}
                <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium ml-auto">
                  <IoCalendarOutline size={14} />
                  {item.date}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-xl font-heading font-extrabold text-slate-900 leading-snug mb-3 group-hover:text-primary-700 transition-colors duration-200">
                {item.title}
              </h2>

              {/* Summary */}
              <p className="text-sm text-slate-500 leading-relaxed">
                {item.summary}
              </p>

              {/* Footer Row */}
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-50">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: item.categoryColor }}
                  >
                    {item.author.charAt(0)}
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">{item.author}</span>
                </div>

                <button className="flex items-center gap-1.5 text-xs font-bold transition-colors duration-200 group/btn"
                  style={{ color: item.categoryColor }}
                >
                  Read More
                  <IoArrowForwardOutline className="group-hover/btn:translate-x-1 transition-transform" size={14} />
                </button>
              </div>
            </div>
          </motion.article>
        ))}

        {/* Newsletter CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-4 rounded-3xl bg-gradient-to-r from-primary-800 to-primary-900 text-white p-10 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(201,162,39,0.15),transparent)]" />
          <div className="relative z-10 space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-accent-500/20 text-accent-300 text-xs font-bold uppercase tracking-widest">
              Stay Informed
            </span>
            <h3 className="text-2xl font-heading font-extrabold">Never Miss an Update</h3>
            <p className="text-primary-200 text-sm max-w-md mx-auto">
              Register on our platform to receive email notifications about new courses, events, and important announcements directly from Swift Institute.
            </p>
            <a
              href="/register"
              className="inline-flex items-center gap-2 mt-2 px-6 py-3 bg-accent-500 hover:bg-accent-600 text-primary-900 font-bold rounded-xl text-sm transition-all duration-200 shadow-lg"
            >
              Create Free Account
              <IoArrowForwardOutline size={16} />
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default NewsAndUpdatesPage;

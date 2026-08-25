import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { 
  IoLogoTwitter, 
  IoLogoFacebook, 
  IoLogoLinkedin, 
  IoMailOutline, 
  IoCallOutline, 
  IoLocationOutline 
} from 'react-icons/io5';

const Footer = () => {
  return (
    <footer className="w-full bg-primary-900 text-slate-400 font-sans border-t border-primary-800 overflow-hidden">
      
      {/* Top Footer Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 w-full">
        
        {/* Brand Information */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3">
            <img
              src="/Logo1.jpeg"
              alt="Swift LMS"
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain rounded-lg bg-white/5 p-0.5"
            />
            <span className="font-extrabold text-xl tracking-tight text-white" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
              Swift
            </span>
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-400">
            Swift Empowering Professionals with Industry Certified Safety and Technology Education.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-2.5 pt-1 sm:pt-2">
            <a href="#" className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary-800 hover:bg-accent-500 hover:text-primary-900 text-slate-400 flex items-center justify-center transition-all duration-300">
              <IoLogoTwitter size={16} />
            </a>
            <a href="#" className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary-800 hover:bg-accent-500 hover:text-primary-900 text-slate-400 flex items-center justify-center transition-all duration-300">
              <IoLogoFacebook size={16} />
            </a>
            <a href="#" className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary-800 hover:bg-accent-500 hover:text-primary-900 text-slate-400 flex items-center justify-center transition-all duration-300">
              <IoLogoLinkedin size={16} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-heading font-semibold text-white tracking-wider mb-5">Quick Links</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to={ROUTES.HOME} className="hover:text-accent-400 transition-colors">Home</Link>
            </li>
            <li>
              <Link to={ROUTES.COURSES} className="hover:text-accent-400 transition-colors">All Courses</Link>
            </li>
            <li>
              <Link to={ROUTES.ABOUT} className="hover:text-accent-400 transition-colors">About Swift</Link>
            </li>
            <li>
              <Link to={ROUTES.FAQ} className="hover:text-accent-400 transition-colors">News &amp; Updates</Link>
            </li>
            <li>
              <Link to={ROUTES.FINANCE_SOFTWARE} className="hover:text-accent-400 transition-colors">Finance Software</Link>
            </li>
          </ul>
        </div>

        {/* Student Resources */}
        <div>
          <h4 className="text-sm font-heading font-semibold text-white tracking-wider mb-5">Student Portal</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to={ROUTES.LOGIN} className="hover:text-accent-400 transition-colors">Student Log In</Link>
            </li>
            <li>
              <Link to={ROUTES.REGISTER} className="hover:text-accent-400 transition-colors">Create Student Account</Link>
            </li>
            <li>
              <Link to={ROUTES.CONTACT} className="hover:text-accent-400 transition-colors">Help & Support</Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-heading font-semibold text-white tracking-wider mb-5">Contact Info</h4>
          <ul className="space-y-3.5 text-sm">
            <li className="flex items-start gap-3">
              <IoMailOutline size={18} className="text-white mt-0.5 shrink-0" />
              <span>info@swiftinstitute.edu.pk</span>
            </li>
            <li className="flex items-start gap-3">
              <IoCallOutline size={18} className="text-white mt-0.5 shrink-0" />
              <span>+92 300 0000000</span>
            </li>
            <li className="flex items-start gap-3">
              <IoLocationOutline size={18} className="text-white mt-0.5 shrink-0" />
              <span>Swift Institute, Pakistan</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Footer Section */}
      <div className="border-t border-primary-800/80 bg-primary-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center gap-3 text-xs text-center">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
          <p className="text-center max-w-xl leading-relaxed px-2">
            © {new Date().getFullYear()} Swift Institute of Safety & Technology – Building Safer Workplaces Through Knowledge & Training
          </p>
        </div>
      </div>

    </footer>
  );
};

export default Footer;

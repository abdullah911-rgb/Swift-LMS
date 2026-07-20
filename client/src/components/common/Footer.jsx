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
    <footer className="bg-primary-900 text-slate-400 font-sans border-t border-primary-800">
      
      {/* Top Footer Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand Information */}
          <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src="/Logo1.jpeg"
              alt="Swift LMS"
              className="h-12 w-12 object-contain rounded-lg bg-white/5 p-0.5"
            />
            <span className="font-heading font-extrabold text-xl tracking-tight text-white">
              Swift
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            Swift — empowering professionals with industry-certified safety and technology education.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-3 pt-2">
            <a href="#" className="h-9 w-9 rounded-xl bg-primary-800 hover:bg-accent-500 hover:text-primary-900 text-slate-400 flex items-center justify-center transition-all duration-300">
              <IoLogoTwitter size={18} />
            </a>
            <a href="#" className="h-9 w-9 rounded-xl bg-primary-800 hover:bg-accent-500 hover:text-primary-900 text-slate-400 flex items-center justify-center transition-all duration-300">
              <IoLogoFacebook size={18} />
            </a>
            <a href="#" className="h-9 w-9 rounded-xl bg-primary-800 hover:bg-accent-500 hover:text-primary-900 text-slate-400 flex items-center justify-center transition-all duration-300">
              <IoLogoLinkedin size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-heading font-semibold text-white uppercase tracking-wider mb-5">Quick Links</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to={ROUTES.HOME} className="hover:text-accent-400 transition-colors">Home</Link>
            </li>
            <li>
              <Link to={ROUTES.COURSES} className="hover:text-accent-400 transition-colors">All Courses</Link>
            </li>
            <li>
              <Link to={ROUTES.ABOUT} className="hover:text-accent-400 transition-colors">About SWIFT</Link>
            </li>
            <li>
              <Link to={ROUTES.FAQ} className="hover:text-accent-400 transition-colors">Frequently Asked Questions</Link>
            </li>
          </ul>
        </div>

        {/* Student Resources */}
        <div>
          <h4 className="text-sm font-heading font-semibold text-white uppercase tracking-wider mb-5">Student Portal</h4>
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
          <h4 className="text-sm font-heading font-semibold text-white uppercase tracking-wider mb-5">Contact Info</h4>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col items-center gap-3 text-xs">
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
          <p>© {new Date().getFullYear()} Swift Institute of Safety & Technology (SMC-PVT) LTD. All rights reserved.</p>
        </div>
      </div>

    </footer>
  );
};

export default Footer;

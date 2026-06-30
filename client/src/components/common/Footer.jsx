import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { 
  IoLogoTwitter, 
  IoLogoFacebook, 
  IoLogoLinkedin, 
  IoLogoGithub, 
  IoMailOutline, 
  IoCallOutline, 
  IoLocationOutline 
} from 'react-icons/io5';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 font-sans border-t border-slate-800">
      
      {/* Top Footer Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 text-white font-heading font-bold text-xl shadow-md shadow-primary-500/20">
              L
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-white">
              LMS<span className="text-primary-400">SaaS</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            A premium production-ready learning management SaaS helping students learn skills from industry expert instructors.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-3 pt-2">
            <a href="#" className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-primary-600 hover:text-white text-slate-400 flex items-center justify-center transition-all duration-300">
              <IoLogoTwitter size={18} />
            </a>
            <a href="#" className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-primary-600 hover:text-white text-slate-400 flex items-center justify-center transition-all duration-300">
              <IoLogoFacebook size={18} />
            </a>
            <a href="#" className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-primary-600 hover:text-white text-slate-400 flex items-center justify-center transition-all duration-300">
              <IoLogoLinkedin size={18} />
            </a>
            <a href="#" className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-primary-600 hover:text-white text-slate-400 flex items-center justify-center transition-all duration-300">
              <IoLogoGithub size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-sm font-heading font-semibold text-white uppercase tracking-wider mb-5">Quick Links</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to={ROUTES.HOME} className="hover:text-primary-400 transition-colors">Home Dashboard</Link>
            </li>
            <li>
              <Link to={ROUTES.COURSES} className="hover:text-primary-400 transition-colors">All Courses</Link>
            </li>
            <li>
              <Link to={ROUTES.ABOUT} className="hover:text-primary-400 transition-colors">About LMS</Link>
            </li>
            <li>
              <Link to={ROUTES.FAQ} className="hover:text-primary-400 transition-colors">Frequently Asked Questions</Link>
            </li>
          </ul>
        </div>

        {/* Student Resources */}
        <div>
          <h4 className="text-sm font-heading font-semibold text-white uppercase tracking-wider mb-5">Student Portal</h4>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to={ROUTES.LOGIN} className="hover:text-primary-400 transition-colors">Student Log In</Link>
            </li>
            <li>
              <Link to={ROUTES.REGISTER} className="hover:text-primary-400 transition-colors">Create Student Account</Link>
            </li>
            <li>
              <Link to={ROUTES.CONTACT} className="hover:text-primary-400 transition-colors">Help & Support</Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h4 className="text-sm font-heading font-semibold text-white uppercase tracking-wider mb-1">Contact Info</h4>
          <ul className="space-y-3.5 text-sm">
            <li className="flex items-start gap-3">
              <IoMailOutline size={18} className="text-primary-400 mt-0.5" />
              <span>support@lmssaas.com</span>
            </li>
            <li className="flex items-start gap-3">
              <IoCallOutline size={18} className="text-primary-400 mt-0.5" />
              <span>+1 (800) 123-4567</span>
            </li>
            <li className="flex items-start gap-3">
              <IoLocationOutline size={18} className="text-primary-400 mt-0.5" />
              <span>100 Technology Dr, Suite 500, San Francisco, CA</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Footer Section */}
      <div className="border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 LMSSaaS. Developed with precision for scalable deployment.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;

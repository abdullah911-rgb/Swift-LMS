import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../constants';
import Button from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IoMenuOutline, 
  IoCloseOutline, 
  IoChevronDownOutline, 
  IoLogOutOutline, 
  IoPersonOutline, 
  IoReaderOutline,
  IoNotificationsOutline
} from 'react-icons/io5';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleProfileDropdown = () => setProfileDropdownOpen(!profileDropdownOpen);

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
    navigate(ROUTES.HOME);
  };

  const navLinks = [
    { label: 'Home', path: ROUTES.HOME },
    { label: 'Courses', path: ROUTES.COURSES },
    { label: 'About Us', path: ROUTES.ABOUT },
    { label: 'FAQ', path: ROUTES.FAQ },
    { label: 'Contact', path: ROUTES.CONTACT },
  ];

  const getPortalLink = (role) => {
    if (role === 'ADMIN') return ROUTES.ADMIN_DASHBOARD;
    if (role === 'INSTRUCTOR') return ROUTES.INSTRUCTOR_DASHBOARD;
    return ROUTES.STUDENT_DASHBOARD;
  };

  const getPortalLabel = (role) => {
    if (role === 'ADMIN') return 'Admin Portal';
    if (role === 'INSTRUCTOR') return 'Instructor Portal';
    return 'Student Portal';
  };

  return (
    <header className="sticky top-0 z-40 w-full glass shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 text-white font-heading font-bold text-xl shadow-md shadow-primary-500/20">
              L
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-slate-800">
              LMS<span className="text-primary-500">SaaS</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => 
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                  ${isActive 
                    ? 'text-primary-600 bg-primary-50/50' 
                    : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Action buttons / User dropdown */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative">
                {/* User Info Bar */}
                <button
                  onClick={toggleProfileDropdown}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-heading font-semibold text-sm">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase">{user.role}</p>
                  </div>
                  <IoChevronDownOutline size={14} className={`text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <>
                      {/* Clickable transparent backdrop to close */}
                      <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-100 rounded-2xl soft-shadow py-2.5 z-20"
                      >
                        <Link
                          to={getPortalLink(user.role)}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-all"
                        >
                          <IoReaderOutline size={18} className="text-slate-400 group-hover:text-primary-600" />
                          <span>{getPortalLabel(user.role)}</span>
                        </Link>
                        
                        <hr className="border-slate-100 my-2" />
                        
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                        >
                          <IoLogOutOutline size={18} />
                          <span>Sign Out</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to={ROUTES.LOGIN}>
                  <Button variant="text" size="sm">Sign In</Button>
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-50 focus:outline-none cursor-pointer"
            >
              {mobileMenuOpen ? <IoCloseOutline size={26} /> : <IoMenuOutline size={26} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md overflow-hidden"
          >
            <div className="px-4 pt-3 pb-6 space-y-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => 
                    `block px-4 py-3 rounded-xl text-base font-medium transition-all
                    ${isActive 
                      ? 'text-primary-600 bg-primary-50' 
                      : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              <hr className="border-slate-100 my-4" />

              {user ? (
                <div className="space-y-2">
                  <div className="px-4 py-2 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-heading font-semibold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-400 font-semibold uppercase">{user.role}</p>
                    </div>
                  </div>
                  <Link
                    to={getPortalLink(user.role)}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-all rounded-xl"
                  >
                    {getPortalLabel(user.role)}
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 transition-all rounded-xl cursor-pointer"
                  >
                    <IoLogOutOutline size={20} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 px-2 pt-2">
                  <Link to={ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" size="md" className="w-full">Sign In</Button>
                  </Link>
                  <Link to={ROUTES.REGISTER} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="md" className="w-full">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;

import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import Button from '../../components/ui/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50/20 font-sans px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-8xl sm:text-9xl font-heading font-extrabold text-primary-200 tracking-wider">
          404
        </h1>
        <div className="space-y-2">
          <h2 className="text-2xl font-heading font-bold text-slate-800">Page Not Found</h2>
          <p className="text-sm text-slate-550 text-slate-500 leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>
        <div className="pt-2">
          <Link to={ROUTES.HOME}>
            <Button variant="primary" size="md">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

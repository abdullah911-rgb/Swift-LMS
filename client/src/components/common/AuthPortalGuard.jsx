import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleHomePath, getRolePortalPrefix } from '../../utils/authRedirect';

/**
 * After a fresh login, ensure the user lands on their primary portal.
 * Prevents stale /instructor URLs from showing the wrong portal after account switches.
 * Exception: enrollment-related public paths (/checkout/, /courses/) are allowed through
 * so the payment flow is preserved after login.
 */

const ENROLLMENT_PUBLIC_PREFIXES = ['/checkout/', '/courses/'];

const AuthPortalGuard = () => {
  const { user, loading, postLoginRole, clearPostLoginRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user || !postLoginRole) return;

    const portalPrefix = getRolePortalPrefix(user.role);
    const home = getRoleHomePath(user.role);

    const isOnEnrollmentPath = ENROLLMENT_PUBLIC_PREFIXES.some((prefix) =>
      location.pathname.startsWith(prefix)
    );

    // Do not override enrollment-related redirects (checkout, course detail)
    if (!isOnEnrollmentPath && portalPrefix && !location.pathname.startsWith(portalPrefix)) {
      navigate(home, { replace: true });
    }

    clearPostLoginRole();
  }, [user, loading, postLoginRole, location.pathname, navigate, clearPostLoginRole]);

  return null;
};

export default AuthPortalGuard;

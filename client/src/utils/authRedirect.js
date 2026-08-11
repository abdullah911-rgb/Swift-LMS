import { ROUTES, ROLES } from '../constants';

export const ROLE_HOME = {
  [ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
  [ROLES.INSTRUCTOR]: ROUTES.INSTRUCTOR_DASHBOARD,
  [ROLES.STUDENT]: ROUTES.STUDENT_DASHBOARD,
};

export const ROLE_PORTAL_PREFIX = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.INSTRUCTOR]: '/instructor',
  [ROLES.STUDENT]: '/student',
};

export const getRoleHomePath = (role) => ROLE_HOME[role] || ROUTES.HOME;

export const getRolePortalPrefix = (role) => ROLE_PORTAL_PREFIX[role] || null;

/**
 * Allowed public paths that should survive a login redirect.
 * If the user was on one of these paths when they were asked to sign in,
 * they should be returned there after a successful login instead of the
 * default portal home.
 */
const PUBLIC_REDIRECT_PREFIXES = ['/checkout/', '/courses/'];

/** Honor deep-link redirects within the user's own portal namespace,
 *  AND for enrollment-related public paths like /checkout/:id */
export const getPostLoginPath = (role, fromPath) => {
  const home = getRoleHomePath(role);
  const portalPrefix = getRolePortalPrefix(role);

  if (!fromPath) return home;

  // Allow portal-specific deep links (e.g. /student/pay/...)
  if (portalPrefix && fromPath.startsWith(portalPrefix)) return fromPath;

  // Allow enrollment-related public paths so the checkout flow is preserved
  if (PUBLIC_REDIRECT_PREFIXES.some((prefix) => fromPath.startsWith(prefix))) {
    return fromPath;
  }

  return home;
};


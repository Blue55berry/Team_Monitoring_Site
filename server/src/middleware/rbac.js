import { GraphQLError } from 'graphql';

/**
 * Role-Based Access Control (RBAC) middleware for GraphQL resolvers
 */

// Check if user is authenticated
export const requireAuth = (user) => {
  if (!user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
  return user;
};

// Check if user has specific role(s)
export const requireRole = (user, roles) => {
  requireAuth(user);
  
  if (!roles.includes(user.role)) {
    throw new GraphQLError(`Access denied. Required role(s): ${roles.join(', ')}`, {
      extensions: { code: 'FORBIDDEN' }
    });
  }
  return user;
};

// Check if user is admin
export const requireAdmin = (user) => {
  return requireRole(user, ['admin']);
};

// Check if user is admin or HR
export const requireAdminOrHR = (user) => {
  return requireRole(user, ['admin', 'hr']);
};

// Check if user is admin, HR, or manager
export const requireManagement = (user) => {
  return requireRole(user, ['admin', 'hr', 'manager']);
};

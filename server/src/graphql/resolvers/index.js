import authResolvers from './authResolvers.js';
import employeeResolvers from './employeeResolvers.js';
import departmentResolvers from './departmentResolvers.js';
import projectResolvers from './projectResolvers.js';
import taskResolvers from './taskResolvers.js';
import attendanceResolvers from './attendanceResolvers.js';
import clientResolvers from './clientResolvers.js';
import leaveResolvers from './leaveResolvers.js';
import notificationResolvers from './notificationResolvers.js';
import dashboardResolvers from './dashboardResolvers.js';
import aiResolvers from './aiResolvers.js';
import settingsResolvers from './settingsResolvers.js';

// Merge all resolvers
const mergeResolvers = (...resolverArrays) => {
  const merged = { Query: {}, Mutation: {}, Subscription: {} };
  
  for (const resolvers of resolverArrays) {
    if (resolvers.Query) Object.assign(merged.Query, resolvers.Query);
    if (resolvers.Mutation) Object.assign(merged.Mutation, resolvers.Mutation);
    if (resolvers.Subscription) Object.assign(merged.Subscription, resolvers.Subscription);
    
    // Merge type resolvers
    for (const [key, value] of Object.entries(resolvers)) {
      if (!['Query', 'Mutation', 'Subscription'].includes(key)) {
        merged[key] = { ...(merged[key] || {}), ...value };
      }
    }
  }
  
  // Remove empty subscription if no subscriptions defined
  if (Object.keys(merged.Subscription).length === 0) delete merged.Subscription;
  
  return merged;
};

const resolvers = mergeResolvers(
  authResolvers,
  employeeResolvers,
  departmentResolvers,
  projectResolvers,
  taskResolvers,
  attendanceResolvers,
  clientResolvers,
  leaveResolvers,
  notificationResolvers,
  dashboardResolvers,
  aiResolvers,
  settingsResolvers
);

export default resolvers;

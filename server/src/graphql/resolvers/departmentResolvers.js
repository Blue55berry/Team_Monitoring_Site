import { Department, Employee } from '../../models/index.js';
import { requireAuth, requireAdminOrHR } from '../../middleware/rbac.js';
import { GraphQLError } from 'graphql';

const departmentResolvers = {
  Query: {
    departments: async (_, __, { user }) => {
      requireAuth(user);
      return Department.find().populate({ path: 'head', populate: { path: 'userId' } }).sort({ name: 1 });
    },
    department: async (_, { id }, { user }) => {
      requireAuth(user);
      return Department.findById(id).populate({ path: 'head', populate: { path: 'userId' } });
    }
  },
  Mutation: {
    createDepartment: async (_, { input }, { user }) => {
      requireAdminOrHR(user);
      const dept = new Department(input);
      await dept.save();
      return Department.findById(dept._id).populate({ path: 'head', populate: { path: 'userId' } });
    },
    updateDepartment: async (_, { id, input }, { user }) => {
      requireAdminOrHR(user);
      const dept = await Department.findByIdAndUpdate(id, input, { new: true }).populate({ path: 'head', populate: { path: 'userId' } });
      if (!dept) throw new GraphQLError('Department not found', { extensions: { code: 'NOT_FOUND' } });
      return dept;
    },
    deleteDepartment: async (_, { id }, { user }) => {
      requireAdminOrHR(user);
      // Check if employees belong to this department
      const empCount = await Employee.countDocuments({ department: id });
      if (empCount > 0) throw new GraphQLError('Cannot delete department with employees', { extensions: { code: 'BAD_USER_INPUT' } });
      await Department.findByIdAndDelete(id);
      return true;
    }
  },
  Department: {
    employeeCount: async (dept) => {
      return Employee.countDocuments({ department: dept._id });
    }
  }
};

export default departmentResolvers;

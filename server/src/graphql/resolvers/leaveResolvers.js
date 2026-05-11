import { GraphQLError } from 'graphql';
import { Leave, Employee } from '../../models/index.js';
import { requireAuth, requireAdminOrHR } from '../../middleware/rbac.js';

const leaveResolvers = {
  Query: {
    leaves: async (_, { employee, status }, { user }) => {
      requireAdminOrHR(user);
      const filter = {};
      if (employee) filter.employee = employee;
      if (status) filter.status = status;
      return Leave.find(filter)
        .populate({ path: 'employee', populate: { path: 'userId' } })
        .populate('approvedBy')
        .sort({ createdAt: -1 });
    },
    myLeaves: async (_, __, { user }) => {
      requireAuth(user);
      const employee = await Employee.findOne({ userId: user._id });
      if (!employee) return [];
      return Leave.find({ employee: employee._id })
        .populate({ path: 'employee', populate: { path: 'userId' } })
        .sort({ createdAt: -1 });
    }
  },
  Mutation: {
    requestLeave: async (_, { input }, { user }) => {
      requireAuth(user);
      const employee = await Employee.findOne({ userId: user._id });
      if (!employee) throw new GraphQLError('Employee record not found', { extensions: { code: 'NOT_FOUND' } });
      const leave = new Leave({ ...input, employee: employee._id, startDate: new Date(input.startDate), endDate: new Date(input.endDate) });
      await leave.save();
      return Leave.findById(leave._id).populate({ path: 'employee', populate: { path: 'userId' } });
    },
    approveLeave: async (_, { id }, { user }) => {
      requireAdminOrHR(user);
      const leave = await Leave.findByIdAndUpdate(id, { status: 'approved', approvedBy: user._id, approvedAt: new Date() }, { new: true })
        .populate({ path: 'employee', populate: { path: 'userId' } }).populate('approvedBy');
      if (!leave) throw new GraphQLError('Leave not found', { extensions: { code: 'NOT_FOUND' } });
      return leave;
    },
    rejectLeave: async (_, { id, reason }, { user }) => {
      requireAdminOrHR(user);
      const leave = await Leave.findByIdAndUpdate(id, { status: 'rejected', approvedBy: user._id, rejectionReason: reason }, { new: true })
        .populate({ path: 'employee', populate: { path: 'userId' } }).populate('approvedBy');
      if (!leave) throw new GraphQLError('Leave not found', { extensions: { code: 'NOT_FOUND' } });
      return leave;
    }
  }
};

export default leaveResolvers;

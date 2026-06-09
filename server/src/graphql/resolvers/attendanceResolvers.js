import { GraphQLError } from 'graphql';
import { Attendance, Employee } from '../../models/index.js';
import { requireAuth, requireAdminOrHR } from '../../middleware/rbac.js';

const attendanceResolvers = {
  Query: {
    attendanceRecords: async (_, { employee, startDate, endDate }, { user }) => {
      requireAdminOrHR(user);
      
      const filter = {};
      if (employee) filter.employee = employee;
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }
      
      return Attendance.find(filter)
        .populate({ path: 'employee', populate: { path: 'userId' } })
        .sort({ date: -1 });
    },
    
    myAttendance: async (_, { startDate, endDate }, { user }) => {
      requireAuth(user);
      
      const employee = await Employee.findOne({ userId: user._id });
      if (!employee) return [];
      
      const filter = { employee: employee._id };
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }
      
      return Attendance.find(filter)
        .populate({ path: 'employee', populate: { path: 'userId' } })
        .sort({ date: -1 });
    },
    
    todayAttendance: async (_, __, { user }) => {
      requireAuth(user);
      
      const employee = await Employee.findOne({ userId: user._id });
      if (!employee) return null;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return Attendance.findOne({
        employee: employee._id,
        date: { $gte: today, $lt: tomorrow }
      }).populate({ path: 'employee', populate: { path: 'userId' } });
    }
  },

  Mutation: {
    checkIn: async (_, { notes, location }, { user }) => {
      requireAuth(user);
      
      const employee = await Employee.findOne({ userId: user._id });
      if (!employee) {
        throw new GraphQLError('Employee record not found', { extensions: { code: 'NOT_FOUND' } });
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if already checked in today
      const existing = await Attendance.findOne({
        employee: employee._id,
        date: today
      });
      
      if (existing && existing.checkIn) {
        throw new GraphQLError('Already checked in today', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      
      const now = new Date();
      let status = now.getHours() >= 10 ? 'late' : 'present';
      
      if (location && employee.assignedLocation && employee.assignedLocation.lat) {
        const R = 6371e3; // metres
        const lat1 = employee.assignedLocation.lat * Math.PI/180;
        const lat2 = location.lat * Math.PI/180;
        const dLat = (location.lat - employee.assignedLocation.lat) * Math.PI/180;
        const dLng = (location.lng - employee.assignedLocation.lng) * Math.PI/180;

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        const allowedRadius = employee.assignedLocation.radius || 100;
        if (distance > allowedRadius) {
           status = 'absent'; // Outside of location area
        }
      } else if (employee.assignedLocation && employee.assignedLocation.lat && !location) {
        throw new GraphQLError('Location is required for check-in', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const attendance = existing || new Attendance({
        employee: employee._id,
        date: today
      });
      
      attendance.checkIn = now;
      attendance.status = status;
      if (notes) attendance.notes = notes;
      if (location) attendance.location = location;
      
      await attendance.save();
      
      return Attendance.findById(attendance._id)
        .populate({ path: 'employee', populate: { path: 'userId' } });
    },
    
    checkOut: async (_, __, { user }) => {
      requireAuth(user);
      
      const employee = await Employee.findOne({ userId: user._id });
      if (!employee) {
        throw new GraphQLError('Employee record not found', { extensions: { code: 'NOT_FOUND' } });
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const attendance = await Attendance.findOne({
        employee: employee._id,
        date: today
      });
      
      if (!attendance || !attendance.checkIn) {
        throw new GraphQLError('Must check in before checking out', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      
      if (attendance.checkOut) {
        throw new GraphQLError('Already checked out today', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      
      attendance.checkOut = new Date();
      await attendance.save(); // This triggers work hours calculation
      
      return Attendance.findById(attendance._id)
        .populate({ path: 'employee', populate: { path: 'userId' } });
    },
    
    recordAttendance: async (_, { input }, { user }) => {
      requireAdminOrHR(user);
      
      const attendance = new Attendance({
        employee: input.employee,
        date: new Date(input.date),
        checkIn: input.checkIn ? new Date(input.checkIn) : undefined,
        checkOut: input.checkOut ? new Date(input.checkOut) : undefined,
        status: input.status || 'present',
        notes: input.notes
      });
      
      await attendance.save();
      
      return Attendance.findById(attendance._id)
        .populate({ path: 'employee', populate: { path: 'userId' } });
    }
  }
};

export default attendanceResolvers;

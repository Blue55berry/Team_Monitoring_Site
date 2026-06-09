import { GraphQLError } from 'graphql';
import { Employee, User, Department, Activity, Attendance } from '../../models/index.js';
import { requireAuth, requireRole, requireAdminOrHR, requireManagement } from '../../middleware/rbac.js';
import { logActivity } from '../../utils/activityLogger.js';

const employeeResolvers = {
  Query: {
    employees: async (_, { department, ragStatus }, { user }) => {
      requireAuth(user);
      const filter = {};
      if (department) filter.department = department;
      if (ragStatus) filter.ragStatus = ragStatus;
      
      return Employee.find(filter)
        .populate('userId')
        .populate('department')
        .populate('manager')
        .sort({ createdAt: -1 });
    },
    
    employee: async (_, { id }, { user }) => {
      requireAuth(user);
      return Employee.findById(id)
        .populate('userId')
        .populate('department')
        .populate('manager');
    }
  },

  Mutation: {
    createEmployee: async (_, { input }, { user }) => {
      requireAdminOrHR(user);
      
      const { firstName, lastName, email, password, designation, department, salary, joiningDate, skills, workType, bio, phone, role, assignedLocation } = input;

      // Create user account first if no userId provided
      let userId = input.userId;
      
      if (!userId) {
        if (!email || !password || !firstName || !lastName) {
          throw new GraphQLError('User details (firstName, lastName, email, password) are required when creating a new employee', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new GraphQLError('User already exists with this email', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }

        const newUser = new User({
          firstName,
          lastName,
          email,
          password,
          role: role || 'employee',
          phone
        });
        await newUser.save();
        userId = newUser._id;
      }

      // Check if employee record already exists
      const existingEmployee = await Employee.findOne({ userId });
      if (existingEmployee) {
        throw new GraphQLError('Employee record already exists for this user', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const employee = new Employee({
        userId,
        designation,
        department,
        salary: salary || { base: 0, bonus: 0, deductions: 0 },
        joiningDate: joiningDate || new Date(),
        skills: skills || [],
        workType: workType || 'office',
        bio,
        assignedLocation
      });

      await employee.save();

      await logActivity({
        type: 'employee',
        action: 'created',
        message: `New employee ${firstName} ${lastName} created by ${user.firstName}`,
        userId: user.id,
        metadata: { employeeId: employee.id, userEmail: email }
      });
      
      return Employee.findById(employee._id)
        .populate('userId')
        .populate('department')
        .populate('manager');
    },

    updateEmployee: async (_, { id, input }, { user }) => {
      requireRole(user, ['admin', 'hr', 'account']);
      
      const employee = await Employee.findById(id);
      if (!employee) {
        throw new GraphQLError('Employee not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // Update user details if provided
      if (input.firstName || input.lastName || input.email || input.phone) {
        const userUpdate = {};
        if (input.firstName) userUpdate.firstName = input.firstName;
        if (input.lastName) userUpdate.lastName = input.lastName;
        if (input.email) userUpdate.email = input.email;
        if (input.phone) userUpdate.phone = input.phone;
        await User.findByIdAndUpdate(employee.userId, userUpdate);
      }

      // Update employee details
      const employeeUpdate = {};
      if (input.designation) employeeUpdate.designation = input.designation;
      if (input.department) employeeUpdate.department = input.department;
      if (input.salary) employeeUpdate.salary = input.salary;
      if (input.skills) employeeUpdate.skills = input.skills;
      if (input.workType) employeeUpdate.workType = input.workType;
      if (input.bio !== undefined) employeeUpdate.bio = input.bio;
      if (input.assignedLocation !== undefined) employeeUpdate.assignedLocation = input.assignedLocation;

      const updated = await Employee.findByIdAndUpdate(id, employeeUpdate, { new: true })
        .populate('userId')
        .populate('department')
        .populate('manager');
      
      return updated;
    },

    deleteEmployee: async (_, { id }, { user }) => {
      requireAdminOrHR(user);
      
      const employee = await Employee.findById(id);
      if (!employee) {
        throw new GraphQLError('Employee not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }

      // Deactivate user account
      await User.findByIdAndUpdate(employee.userId, { isActive: false });
      await Employee.findByIdAndDelete(id);

      await logActivity({
        type: 'employee',
        action: 'deleted',
        message: `Employee record for ID ${id} was removed by ${user.firstName}`,
        userId: user.id,
        metadata: { employeeId: id }
      });
      
      return true;
    }
  },

  Employee: {
    userId: async (employee) => {
      if (employee.userId && typeof employee.userId === 'object' && employee.userId.firstName) {
        return employee.userId;
      }
      return User.findById(employee.userId);
    },
    department: async (employee) => {
      if (employee.department && typeof employee.department === 'object' && employee.department.name) {
        return employee.department;
      }
      if (!employee.department) return null;
      return Department.findById(employee.department);
    },
    manager: async (employee) => {
      if (!employee.manager) return null;
      if (employee.manager && typeof employee.manager === 'object' && employee.manager.designation) {
        return employee.manager;
      }
      return Employee.findById(employee.manager).populate('userId');
    },
    attendanceSummary: async (employee) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const presentRecords = await Attendance.find({
        employee: employee._id,
        date: { $gte: startOfMonth, $lte: endOfMonth },
        status: { $in: ['present', 'half-day'] } // Or define what counts as "present"
      });

      return {
        presentDays: presentRecords.length,
        totalDays: endOfMonth.getDate() // Total days in the current month
      };
    }
  }
};

export default employeeResolvers;

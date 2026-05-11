import { Employee, Project, Task, Client, Attendance, Department, Activity } from '../../models/index.js';
import { requireAuth } from '../../middleware/rbac.js';

const dashboardResolvers = {
  Query: {
    dashboardStats: async (_, __, { user }) => {
      requireAuth(user);

      const [totalEmployees, totalProjects, totalTasks, totalClients] = await Promise.all([
        Employee.countDocuments(),
        Project.countDocuments(),
        Task.countDocuments(),
        Client.countDocuments()
      ]);

      const activeProjects = await Project.countDocuments({ status: 'active' });
      const pendingTasks = await Task.countDocuments({ status: { $in: ['todo', 'in-progress'] } });

      // Today's attendance
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const presentToday = await Attendance.countDocuments({
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ['present', 'late'] }
      });

      // Pending leaves
      const { default: Leave } = await import('../../models/Leave.js');
      const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

      // Projects by status
      const projectsByStatus = await Project.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ]);

      // Tasks by status
      const tasksByStatus = await Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ]);

      // RAG distribution (projects)
      const ragDistribution = await Project.aggregate([
        { $group: { _id: '$ragStatus', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ]);

      // Project progress data
      const projectProgress = await Project.find({ status: 'active' })
        .select('name progress ragStatus')
        .limit(10)
        .lean();

      const projectProgressData = projectProgress.map(p => ({
        name: p.name,
        progress: p.progress,
        ragStatus: p.ragStatus
      }));

      // Monthly attendance (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyAttendance = await Attendance.aggregate([
        { $match: { date: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
          }
        },
        { $sort: { _id: 1 } },
        { $project: { month: '$_id', present: 1, absent: 1, late: 1, _id: 0 } }
      ]);

      // Recent activities
      const recentActivitiesRaw = await Activity.find()
        .populate('user', 'firstName lastName avatar')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const recentActivities = recentActivitiesRaw.map(a => ({
        id: a._id,
        type: a.type,
        message: a.message,
        timestamp: a.createdAt.toISOString(),
        user: a.user ? `${a.user.firstName} ${a.user.lastName}` : 'System'
      }));

      return {
        totalEmployees,
        totalProjects,
        totalTasks,
        totalClients,
        activeProjects,
        pendingTasks,
        presentToday,
        pendingLeaves,
        projectsByStatus,
        tasksByStatus,
        ragDistribution,
        recentActivities,
        monthlyAttendance,
        projectProgress: projectProgressData
      };
    }
  }
};

export default dashboardResolvers;

import { GraphQLError } from 'graphql';
import { Task, Employee, Project } from '../../models/index.js';
import { requireAuth, requireManagement } from '../../middleware/rbac.js';

const taskResolvers = {
  Query: {
    tasks: async (_, { project, status, assignedTo }, { user }) => {
      requireAuth(user);
      const filter = {};
      if (project) filter.project = project;
      if (status) filter.status = status.replace('_', '-');
      if (assignedTo) filter.assignedTo = assignedTo;
      
      return Task.find(filter)
        .populate({ path: 'project' })
        .populate({ path: 'assignedTo', populate: { path: 'userId' } })
        .populate('assignedBy')
        .populate('comments.user')
        .sort({ order: 1, createdAt: -1 });
    },
    
    task: async (_, { id }, { user }) => {
      requireAuth(user);
      return Task.findById(id)
        .populate({ path: 'project' })
        .populate({ path: 'assignedTo', populate: { path: 'userId' } })
        .populate('assignedBy')
        .populate('comments.user');
    },
    
    myTasks: async (_, __, { user }) => {
      requireAuth(user);
      const employee = await Employee.findOne({ userId: user._id });
      if (!employee) return [];
      
      return Task.find({ assignedTo: employee._id })
        .populate({ path: 'project' })
        .populate({ path: 'assignedTo', populate: { path: 'userId' } })
        .populate('assignedBy')
        .sort({ dueDate: 1 });
    }
  },

  Mutation: {
    createTask: async (_, { input }, { user }) => {
      requireAuth(user);
      
      const task = new Task({
        ...input,
        assignedBy: user._id,
        status: input.status ? input.status.replace('_', '-') : 'todo'
      });
      
      await task.save();
      
      return Task.findById(task._id)
        .populate({ path: 'project' })
        .populate({ path: 'assignedTo', populate: { path: 'userId' } })
        .populate('assignedBy');
    },

    updateTask: async (_, { id, input }, { user }) => {
      requireAuth(user);
      
      const updateData = { ...input };
      if (updateData.status) {
        updateData.status = updateData.status.replace('_', '-');
      }
      
      const task = await Task.findByIdAndUpdate(id, updateData, { new: true })
        .populate({ path: 'project' })
        .populate({ path: 'assignedTo', populate: { path: 'userId' } })
        .populate('assignedBy')
        .populate('comments.user');
      
      if (!task) {
        throw new GraphQLError('Task not found', { extensions: { code: 'NOT_FOUND' } });
      }

      // Auto-update project progress based on task completion
      const projectTasks = await Task.find({ project: task.project._id || task.project });
      const completedTasks = projectTasks.filter(t => t.status === 'completed');
      const progress = projectTasks.length > 0 
        ? Math.round((completedTasks.length / projectTasks.length) * 100)
        : 0;
      
      await Project.findByIdAndUpdate(task.project._id || task.project, { progress });
      
      return task;
    },

    deleteTask: async (_, { id }, { user }) => {
      requireAuth(user);
      
      const task = await Task.findByIdAndDelete(id);
      if (!task) {
        throw new GraphQLError('Task not found', { extensions: { code: 'NOT_FOUND' } });
      }
      
      return true;
    },

    addComment: async (_, { taskId, text }, { user }) => {
      requireAuth(user);
      
      const task = await Task.findById(taskId);
      if (!task) {
        throw new GraphQLError('Task not found', { extensions: { code: 'NOT_FOUND' } });
      }
      
      task.comments.push({ user: user._id, text });
      await task.save();
      
      return Task.findById(taskId)
        .populate({ path: 'project' })
        .populate({ path: 'assignedTo', populate: { path: 'userId' } })
        .populate('assignedBy')
        .populate('comments.user');
    },

    reorderTasks: async (_, { projectId, taskIds }, { user }) => {
      requireAuth(user);
      
      const updates = taskIds.map((id, index) => 
        Task.findByIdAndUpdate(id, { order: index })
      );
      
      await Promise.all(updates);
      return true;
    }
  }
};

export default taskResolvers;

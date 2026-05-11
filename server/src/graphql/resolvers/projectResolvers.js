import { GraphQLError } from 'graphql';
import { Project, Task, Employee, Client, Notification } from '../../models/index.js';
import { requireAuth, requireManagement } from '../../middleware/rbac.js';

const projectResolvers = {
  Query: {
    projects: async (_, { status, ragStatus }, { user }) => {
      requireAuth(user);
      const filter = {};
      if (status) filter.status = status.replace('_', '-');
      if (ragStatus) filter.ragStatus = ragStatus;
      
      return Project.find(filter)
        .populate('client')
        .populate({ path: 'team', populate: { path: 'userId' } })
        .populate({ path: 'projectManager', populate: { path: 'userId' } })
        .sort({ updatedAt: -1 });
    },
    
    project: async (_, { id }, { user }) => {
      requireAuth(user);
      return Project.findById(id)
        .populate('client')
        .populate({ path: 'team', populate: { path: 'userId' } })
        .populate({ path: 'projectManager', populate: { path: 'userId' } });
    }
  },

  Mutation: {
    createProject: async (_, { input }, { user }) => {
      requireManagement(user);
      
      const project = new Project({
        ...input,
        status: input.status ? input.status.replace('_', '-') : 'planning'
      });
      
      await project.save();
      
      return Project.findById(project._id)
        .populate('client')
        .populate({ path: 'team', populate: { path: 'userId' } })
        .populate({ path: 'projectManager', populate: { path: 'userId' } });
    },

    updateProject: async (_, { id, input }, { user }) => {
      requireManagement(user);
      
      // Fetch the old project to compare team members
      const oldProject = await Project.findById(id).populate({ path: 'team', populate: { path: 'userId' } });
      if (!oldProject) {
        throw new GraphQLError('Project not found', { extensions: { code: 'NOT_FOUND' } });
      }

      const updateData = { ...input };
      if (updateData.status) {
        updateData.status = updateData.status.replace('_', '-');
      }
      
      const project = await Project.findByIdAndUpdate(id, updateData, { new: true })
        .populate('client')
        .populate({ path: 'team', populate: { path: 'userId' } })
        .populate({ path: 'projectManager', populate: { path: 'userId' } });
      
      // Notify existing members if new members are added
      if (input.team && oldProject.team) {
        const oldTeamIds = oldProject.team.map(emp => emp._id.toString());
        const newTeamIds = input.team.map(id => id.toString());
        
        const addedMemberIds = newTeamIds.filter(id => !oldTeamIds.includes(id));
        
        if (addedMemberIds.length > 0) {
          const addedEmployees = project.team.filter(emp => addedMemberIds.includes(emp._id.toString()));
          const addedNames = addedEmployees.map(emp => `${emp.userId?.firstName} ${emp.userId?.lastName}`).join(', ');
          
          const existingEmployees = oldProject.team;
          
          const notificationPromises = existingEmployees.map(emp => {
            if (!emp.userId) return Promise.resolve();
            return new Notification({
              recipient: emp.userId._id,
              type: 'project',
              title: 'Team Update',
              message: `${addedNames} joined the project: ${project.name}.`,
              link: `/projects/${project._id}`
            }).save();
          });
          
          await Promise.all(notificationPromises);
        }
      }
      
      return project;
    },

    deleteProject: async (_, { id }, { user }) => {
      requireManagement(user);
      
      const project = await Project.findByIdAndDelete(id);
      if (!project) {
        throw new GraphQLError('Project not found', { extensions: { code: 'NOT_FOUND' } });
      }
      
      // Delete associated tasks
      await Task.deleteMany({ project: id });
      
      return true;
    },

    updateProjectProgress: async (_, { id, progress }, { user }) => {
      requireAuth(user);
      
      const project = await Project.findById(id);
      if (!project) {
        throw new GraphQLError('Project not found', { extensions: { code: 'NOT_FOUND' } });
      }
      
      project.progress = progress;
      await project.save(); // This triggers the RAG status pre-save hook
      
      return Project.findById(id)
        .populate('client')
        .populate({ path: 'team', populate: { path: 'userId' } })
        .populate({ path: 'projectManager', populate: { path: 'userId' } });
    },

    addMilestone: async (_, { projectId, input }, { user }) => {
      requireManagement(user);
      
      const project = await Project.findById(projectId);
      if (!project) {
        throw new GraphQLError('Project not found', { extensions: { code: 'NOT_FOUND' } });
      }
      
      project.milestones.push(input);
      await project.save();
      
      return Project.findById(projectId)
        .populate('client')
        .populate({ path: 'team', populate: { path: 'userId' } })
        .populate({ path: 'projectManager', populate: { path: 'userId' } });
    },

    completeMilestone: async (_, { projectId, milestoneIndex }, { user }) => {
      requireAuth(user);
      
      const project = await Project.findById(projectId);
      if (!project || !project.milestones[milestoneIndex]) {
        throw new GraphQLError('Project or milestone not found', { extensions: { code: 'NOT_FOUND' } });
      }
      
      project.milestones[milestoneIndex].completed = true;
      project.milestones[milestoneIndex].completedAt = new Date();
      await project.save();
      
      return Project.findById(projectId)
        .populate('client')
        .populate({ path: 'team', populate: { path: 'userId' } })
        .populate({ path: 'projectManager', populate: { path: 'userId' } });
    }
  },

  Project: {
    taskCount: async (project) => {
      return Task.countDocuments({ project: project._id });
    }
  }
};

export default projectResolvers;

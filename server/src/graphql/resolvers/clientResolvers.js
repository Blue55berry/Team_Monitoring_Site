import { GraphQLError } from 'graphql';
import { Client } from '../../models/index.js';
import { requireAuth, requireManagement } from '../../middleware/rbac.js';

const clientResolvers = {
  Query: {
    clients: async (_, { status, ragStatus }, { user }) => {
      requireAuth(user);
      const filter = {};
      if (status) filter.status = status;
      if (ragStatus) filter.ragStatus = ragStatus;
      return Client.find(filter).populate('projects').sort({ updatedAt: -1 });
    },
    client: async (_, { id }, { user }) => {
      requireAuth(user);
      return Client.findById(id).populate('projects');
    }
  },
  Mutation: {
    createClient: async (_, { input }, { user }) => {
      requireManagement(user);
      const client = new Client(input);
      await client.save();
      return Client.findById(client._id).populate('projects');
    },
    updateClient: async (_, { id, input }, { user }) => {
      requireManagement(user);
      const client = await Client.findByIdAndUpdate(id, input, { new: true }).populate('projects');
      if (!client) throw new GraphQLError('Client not found', { extensions: { code: 'NOT_FOUND' } });
      return client;
    },
    deleteClient: async (_, { id }, { user }) => {
      requireManagement(user);
      const client = await Client.findByIdAndDelete(id);
      if (!client) throw new GraphQLError('Client not found', { extensions: { code: 'NOT_FOUND' } });
      return true;
    },
    scheduleMeeting: async (_, { input }, { user }) => {
      requireAuth(user);
      const client = await Client.findById(input.clientId);
      if (!client) throw new GraphQLError('Client not found', { extensions: { code: 'NOT_FOUND' } });
      client.meetings.push({ date: new Date(input.date), title: input.title, notes: input.notes, status: 'scheduled' });
      await client.save();
      return Client.findById(client._id).populate('projects');
    }
  }
};

export default clientResolvers;

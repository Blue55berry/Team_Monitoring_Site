import { getAIResponse } from '../../services/aiService.js';
import { requireAuth } from '../../middleware/rbac.js';
import { AIChatSession } from '../../models/index.js';

const aiResolvers = {
  Query: {
    askAI: async (_, { question, sessionId }, { user }) => {
      requireAuth(user);
      
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key') {
        return {
          answer: "AI Assistant is not configured. Please add a valid GEMINI_API_KEY to the server .env file.",
          sources: [],
          confidence: 0,
          sessionId: null
        };
      }

      let session;
      if (sessionId) {
        session = await AIChatSession.findOne({ _id: sessionId, user: user.id });
      }
      if (!session) {
        session = new AIChatSession({
          user: user.id,
          title: question.substring(0, 40) + (question.length > 40 ? '...' : ''),
          messages: []
        });
      }
      
      session.messages.push({ role: 'user', content: question });

      const response = await getAIResponse(question);

      session.messages.push({ role: 'assistant', content: response.answer });
      await session.save();

      return {
        ...response,
        sessionId: session.id
      };
    },
    myChatSessions: async (_, __, { user }) => {
      requireAuth(user);
      return await AIChatSession.find({ user: user.id }).sort({ updatedAt: -1 });
    },
    chatSession: async (_, { id }, { user }) => {
      requireAuth(user);
      return await AIChatSession.findOne({ _id: id, user: user.id });
    }
  },
  Mutation: {
    syncRAGData: async (_, __, { user }) => {
      requireAuth(user);
      return true;
    },
    deleteChatSession: async (_, { id }, { user }) => {
      requireAuth(user);
      const result = await AIChatSession.deleteOne({ _id: id, user: user.id });
      return result.deletedCount > 0;
    }
  }
};

export default aiResolvers;

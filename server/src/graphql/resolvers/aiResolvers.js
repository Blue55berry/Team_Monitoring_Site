import { getAIResponse } from '../../services/aiService.js';
import { requireAuth } from '../../middleware/rbac.js';

const aiResolvers = {
  Query: {
    askAI: async (_, { question }, { user }) => {
      requireAuth(user);
      
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key') {
        return {
          answer: "AI Assistant is not configured. Please add a valid GEMINI_API_KEY to the server .env file.",
          sources: [],
          confidence: 0
        };
      }

      return await getAIResponse(question);
    }
  },
  Mutation: {
    syncRAGData: async (_, __, { user }) => {
      requireAuth(user);
      // Logic for syncing data to vector database (ChromaDB) would go here
      // For now, we return true as we are using direct DB context in aiService
      return true;
    }
  }
};

export default aiResolvers;

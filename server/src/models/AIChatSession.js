import mongoose from 'mongoose';

const aiChatMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const aiChatSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'New Chat' },
  messages: [aiChatMessageSchema]
}, { timestamps: true });

const AIChatSession = mongoose.model('AIChatSession', aiChatSessionSchema);
export default AIChatSession;

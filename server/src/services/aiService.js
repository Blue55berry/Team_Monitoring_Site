import { GoogleGenerativeAI } from '@google/generative-ai';
import { Employee, Project, Task, Client, Department } from '../models/index.js';

export const getAIResponse = async (question) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    // 1. Gather context from the database (Simulated RAG - gathering key records)
    const [employees, projects, tasks, departments] = await Promise.all([
      Employee.find().populate('userId').limit(20),
      Project.find().limit(10),
      Task.find().limit(20),
      Department.find()
    ]);

    const context = `
      You are an AI Workforce Intelligence Assistant for an enterprise management platform.
      Current Data Summary:
      - Total Employees: ${employees.length}
      - Total Projects: ${projects.length}
      - Total Tasks: ${tasks.length}
      - Departments: ${departments.map(d => d.name).join(', ')}

      Detailed Data Context:
      Employees: ${employees.map(e => `${e.userId.firstName} ${e.userId.lastName} (${e.designation}, Dept: ${e.department}, RAG: ${e.ragStatus})`).join('; ')}
      Active Projects: ${projects.map(p => `${p.name} (Progress: ${p.progress}%, Status: ${p.status}, RAG: ${p.ragStatus})`).join('; ')}
      Recent Tasks: ${tasks.map(t => `${t.title} (Priority: ${t.priority}, Status: ${t.status})`).join('; ')}

      User Question: "${question}"

      Please provide a data-driven, professional answer based ONLY on the context provided above. If the information isn't available, say you don't have enough data but offer to help with what you do know. Use markdown for formatting.
    `;

    const result = await model.generateContent(context);
    const response = await result.response;
    return {
      answer: response.text(),
      sources: ['Database - Employees', 'Database - Projects', 'Database - Tasks'],
      confidence: 0.95
    };
  } catch (error) {
    console.error('AI Service Error:', error);
    if (error.cause) {
      console.error('AI Service Error Cause:', error.cause);
    }
    throw new Error('Failed to generate AI response: ' + error.message);
  }
};

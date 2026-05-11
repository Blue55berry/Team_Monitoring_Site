import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Client from '../models/Client.js';
import Attendance from '../models/Attendance.js';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}), Employee.deleteMany({}), Department.deleteMany({}),
      Project.deleteMany({}), Task.deleteMany({}), Client.deleteMany({}),
      Attendance.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create departments
    const departments = await Department.insertMany([
      { name: 'Engineering', description: 'Software development and engineering', budget: 500000, color: '#6366f1' },
      { name: 'Design', description: 'UI/UX and product design', budget: 200000, color: '#ec4899' },
      { name: 'Marketing', description: 'Marketing and growth', budget: 150000, color: '#f59e0b' },
      { name: 'Human Resources', description: 'People and culture', budget: 100000, color: '#10b981' },
      { name: 'Sales', description: 'Sales and business development', budget: 300000, color: '#3b82f6' }
    ]);
    console.log('Created departments');

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = await User.insertMany([
      { firstName: 'Admin', lastName: 'User', email: 'admin@workforce.com', password: hashedPassword, role: 'admin' },
      { firstName: 'Sarah', lastName: 'Chen', email: 'sarah@workforce.com', password: hashedPassword, role: 'hr' },
      { firstName: 'James', lastName: 'Wilson', email: 'james@workforce.com', password: hashedPassword, role: 'manager' },
      { firstName: 'Emily', lastName: 'Davis', email: 'emily@workforce.com', password: hashedPassword, role: 'employee' },
      { firstName: 'Michael', lastName: 'Brown', email: 'michael@workforce.com', password: hashedPassword, role: 'employee' },
      { firstName: 'Lisa', lastName: 'Taylor', email: 'lisa@workforce.com', password: hashedPassword, role: 'employee' },
      { firstName: 'David', lastName: 'Martinez', email: 'david@workforce.com', password: hashedPassword, role: 'employee' },
      { firstName: 'Anna', lastName: 'Johnson', email: 'anna@workforce.com', password: hashedPassword, role: 'employee' },
      { firstName: 'Accountant', lastName: 'User', email: 'account@workforce.com', password: hashedPassword, role: 'account' },
      { firstName: 'Robert', lastName: 'King', email: 'team_leader@workforce.com', password: hashedPassword, role: 'team_leader' }
    ]);
    console.log('Created users');

    // Create employees
    const employees = await Employee.insertMany([
      { userId: users[1]._id, employeeId: 'EMP-00001', designation: 'HR Manager', department: departments[3]._id, salary: { base: 85000, bonus: 5000, deductions: 2000 }, skills: ['Recruitment', 'People Management'], ragStatus: 'green', performanceScore: 88 },
      { userId: users[2]._id, employeeId: 'EMP-00002', designation: 'Engineering Lead', department: departments[0]._id, salary: { base: 120000, bonus: 10000, deductions: 3000 }, skills: ['React', 'Node.js', 'System Design'], ragStatus: 'green', performanceScore: 92 },
      { userId: users[3]._id, employeeId: 'EMP-00003', designation: 'Frontend Developer', department: departments[0]._id, salary: { base: 75000, bonus: 3000, deductions: 1500 }, skills: ['React', 'TypeScript', 'CSS'], ragStatus: 'green', performanceScore: 78 },
      { userId: users[4]._id, employeeId: 'EMP-00004', designation: 'Backend Developer', department: departments[0]._id, salary: { base: 80000, bonus: 4000, deductions: 2000 }, skills: ['Node.js', 'Python', 'MongoDB'], ragStatus: 'amber', performanceScore: 65 },
      { userId: users[5]._id, employeeId: 'EMP-00005', designation: 'UI/UX Designer', department: departments[1]._id, salary: { base: 70000, bonus: 3000, deductions: 1500 }, skills: ['Figma', 'Adobe XD', 'Prototyping'], ragStatus: 'green', performanceScore: 85 },
      { userId: users[6]._id, employeeId: 'EMP-00006', designation: 'Marketing Specialist', department: departments[2]._id, salary: { base: 60000, bonus: 2000, deductions: 1000 }, skills: ['SEO', 'Content Marketing', 'Analytics'], ragStatus: 'red', performanceScore: 45 },
      { userId: users[7]._id, employeeId: 'EMP-00007', designation: 'Sales Executive', department: departments[4]._id, salary: { base: 55000, bonus: 8000, deductions: 1000 }, skills: ['Negotiation', 'CRM', 'Cold Outreach'], ragStatus: 'green', performanceScore: 82 },
      { userId: users[9]._id, employeeId: 'EMP-00008', designation: 'Development Team Leader', department: departments[0]._id, salary: { base: 100000, bonus: 8000, deductions: 2500 }, skills: ['Leadership', 'Agile', 'System Architecture'], ragStatus: 'green', performanceScore: 94 }
    ]);
    console.log('Created employees');

    // Create clients
    const clients = await Client.insertMany([
      { companyName: 'TechVista Solutions', contactPerson: 'Robert Kim', email: 'robert@techvista.com', phone: '+1-555-0101', industry: 'Technology', status: 'active', ragStatus: 'green', contractValue: 150000 },
      { companyName: 'GreenLeaf Industries', contactPerson: 'Maria Garcia', email: 'maria@greenleaf.com', phone: '+1-555-0202', industry: 'Manufacturing', status: 'active', ragStatus: 'amber', contractValue: 80000, followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
      { companyName: 'CloudNine Corp', contactPerson: 'Alex Thompson', email: 'alex@cloudnine.io', phone: '+1-555-0303', industry: 'SaaS', status: 'prospect', ragStatus: 'green', contractValue: 200000 }
    ]);
    console.log('Created clients');

    // Create projects
    const projects = await Project.insertMany([
      { name: 'E-Commerce Platform', description: 'Full-stack e-commerce platform with payment integration', client: clients[0]._id, team: [employees[1]._id, employees[2]._id, employees[3]._id], projectManager: employees[1]._id, startDate: new Date('2026-01-15'), deadline: new Date('2026-06-30'), progress: 68, status: 'active', ragStatus: 'green', priority: 'high', tags: ['web', 'e-commerce'], techStack: ['React', 'Node.js', 'MongoDB', 'Stripe'], budget: { allocated: 80000, spent: 52000 }, milestones: [{ title: 'MVP Launch', dueDate: new Date('2026-03-01'), completed: true, completedAt: new Date('2026-02-28') }, { title: 'Payment Integration', dueDate: new Date('2026-04-15'), completed: true, completedAt: new Date('2026-04-10') }, { title: 'Final Launch', dueDate: new Date('2026-06-30'), completed: false }] },
      { name: 'Mobile Banking App', description: 'Cross-platform mobile banking application', client: clients[1]._id, team: [employees[1]._id, employees[4]._id], projectManager: employees[1]._id, startDate: new Date('2026-02-01'), deadline: new Date('2026-08-15'), progress: 35, status: 'active', ragStatus: 'amber', priority: 'critical', tags: ['mobile', 'fintech'], techStack: ['React Native', 'Node.js', 'PostgreSQL'], budget: { allocated: 120000, spent: 40000 } },
      { name: 'Marketing Dashboard', description: 'Analytics dashboard for marketing campaigns', client: clients[2]._id, team: [employees[2]._id, employees[4]._id, employees[5]._id], projectManager: employees[1]._id, startDate: new Date('2026-03-10'), deadline: new Date('2026-05-20'), progress: 20, status: 'active', ragStatus: 'red', priority: 'high', tags: ['analytics', 'dashboard'], techStack: ['React', 'D3.js', 'Python'], budget: { allocated: 45000, spent: 30000 } },
      { name: 'CRM System Upgrade', description: 'Upgrade existing CRM with AI features', team: [employees[3]._id], projectManager: employees[1]._id, startDate: new Date('2026-04-01'), deadline: new Date('2026-09-30'), progress: 10, status: 'planning', ragStatus: 'green', priority: 'medium', tags: ['crm', 'ai'], techStack: ['React', 'Python', 'TensorFlow'], budget: { allocated: 60000, spent: 5000 } }
    ]);
    console.log('Created projects');

    // Create tasks
    await Task.insertMany([
      { title: 'Design Product Page UI', description: 'Create responsive product page layout', project: projects[0]._id, assignedTo: employees[4]._id, assignedBy: users[2]._id, priority: 'high', status: 'completed', dueDate: new Date('2026-03-15'), estimatedHours: 16, actualHours: 14, tags: ['ui', 'design'], order: 0 },
      { title: 'Implement Shopping Cart API', description: 'Build REST API for shopping cart operations', project: projects[0]._id, assignedTo: employees[3]._id, assignedBy: users[2]._id, priority: 'high', status: 'completed', dueDate: new Date('2026-03-20'), estimatedHours: 24, actualHours: 28, tags: ['api', 'backend'], order: 1 },
      { title: 'Payment Gateway Integration', description: 'Integrate Stripe payment processing', project: projects[0]._id, assignedTo: employees[1]._id, assignedBy: users[2]._id, priority: 'critical', status: 'in-progress', dueDate: new Date('2026-05-10'), estimatedHours: 32, tags: ['payments', 'integration'], order: 2 },
      { title: 'User Authentication Flow', description: 'Implement OAuth2 login flow', project: projects[0]._id, assignedTo: employees[2]._id, assignedBy: users[2]._id, priority: 'high', status: 'review', dueDate: new Date('2026-04-25'), estimatedHours: 20, actualHours: 18, tags: ['auth', 'security'], order: 3 },
      { title: 'Mobile App Wireframes', description: 'Create wireframes for all banking screens', project: projects[1]._id, assignedTo: employees[4]._id, assignedBy: users[2]._id, priority: 'high', status: 'completed', dueDate: new Date('2026-03-01'), estimatedHours: 20, actualHours: 22, tags: ['design', 'mobile'], order: 0 },
      { title: 'Account Balance API', description: 'Build API for balance inquiries', project: projects[1]._id, assignedTo: employees[1]._id, assignedBy: users[2]._id, priority: 'critical', status: 'in-progress', dueDate: new Date('2026-05-15'), estimatedHours: 16, tags: ['api', 'fintech'], order: 1 },
      { title: 'Dashboard Charts Setup', description: 'Set up D3.js charts for analytics', project: projects[2]._id, assignedTo: employees[2]._id, assignedBy: users[2]._id, priority: 'medium', status: 'todo', dueDate: new Date('2026-05-01'), estimatedHours: 24, tags: ['charts', 'frontend'], order: 0 },
      { title: 'Campaign Data Pipeline', description: 'Build ETL pipeline for marketing data', project: projects[2]._id, assignedTo: employees[3]._id, assignedBy: users[2]._id, priority: 'high', status: 'todo', dueDate: new Date('2026-04-20'), estimatedHours: 30, tags: ['data', 'backend'], order: 1 },
      { title: 'CRM Requirements Doc', description: 'Document all requirements for CRM upgrade', project: projects[3]._id, assignedTo: employees[1]._id, assignedBy: users[2]._id, priority: 'medium', status: 'in-progress', dueDate: new Date('2026-04-30'), estimatedHours: 8, tags: ['documentation'], order: 0 }
    ]);
    console.log('Created tasks');

    // Create attendance records for last 7 days
    const attendanceRecords = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);
      
      for (const emp of employees) {
        const isAbsent = Math.random() < 0.1;
        const isLate = !isAbsent && Math.random() < 0.15;
        const checkInHour = isLate ? 10 + Math.floor(Math.random() * 2) : 9;
        const checkIn = new Date(date); checkIn.setHours(checkInHour, Math.floor(Math.random() * 60));
        const checkOut = new Date(date); checkOut.setHours(17 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));

        attendanceRecords.push({
          employee: emp._id,
          date,
          checkIn: isAbsent ? undefined : checkIn,
          checkOut: isAbsent ? undefined : checkOut,
          status: isAbsent ? 'absent' : isLate ? 'late' : 'present',
          workHours: isAbsent ? 0 : ((checkOut - checkIn) / 3600000).toFixed(2),
          overtime: isAbsent ? 0 : Math.max(0, ((checkOut - checkIn) / 3600000 - 8)).toFixed(2)
        });
      }
    }
    await Attendance.insertMany(attendanceRecords);
    console.log('Created attendance records');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('  Admin:    admin@workforce.com / password123');
    console.log('  HR:       sarah@workforce.com / password123');
    console.log('  Manager:  james@workforce.com / password123');
    console.log('  Team Lead: team_leader@workforce.com / password123');
    console.log('  Account:  account@workforce.com / password123');
    console.log('  Employee: emily@workforce.com / password123\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();

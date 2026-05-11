import { useQuery } from "@apollo/client/react";
import { GET_DASHBOARD_STATS, GET_MY_TASKS, GET_EMPLOYEES } from '../graphql/operations';
import { useAuth } from '../context/AuthContext';
import {
  Users, FolderKanban, CheckSquare, Briefcase,
  TrendingUp, Clock, UserCheck, CalendarX,
  ArrowUpRight, ArrowDownRight, BarChart2, DollarSign
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
const RAG_COLORS = { green: '#10b981', amber: '#f59e0b', red: '#ef4444' };

const StatCard = ({ icon: Icon, label, value, change, changeType, color, delay }) => (
  <div className="card group hover:scale-[1.02] animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-surface-400 font-medium">{label}</p>
        <p className="text-3xl font-bold text-surface-900 dark:text-white mt-1">{value}</p>
        {change && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${changeType === 'up' ? 'text-success' : 'text-danger'}`}>
            {changeType === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change}
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} transition-transform group-hover:scale-110`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
  </div>
);

const RAGBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold rag-${status}`}>
    <span className="w-2 h-2 rounded-full" style={{ background: RAG_COLORS[status] }} />
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

const EmployeeDashboard = ({ user }) => {
  const { data: tasksData, loading: tasksLoading } = useQuery(GET_MY_TASKS);
  
  const tasks = tasksData?.myTasks || [];
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const reviewCount = tasks.filter(t => t.status === 'review').length;
  
  const taskChartData = [
    { name: 'To Do', value: todoCount, color: '#6366f1' },
    { name: 'In Progress', value: inProgressCount, color: '#ec4899' },
    { name: 'Review', value: reviewCount, color: '#f59e0b' },
    { name: 'Completed', value: completedCount, color: '#10b981' }
  ].filter(d => d.value > 0);

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            Welcome back, {user?.firstName}! 
          </h1>
          <p className="text-surface-400 mt-1">Here is your personal workspace overview.</p>
        </div>
        <div className="text-sm text-surface-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 border-0 text-white animate-slide-up">
          <p className="text-white/70 font-medium mb-1">To Do</p>
          <p className="text-4xl font-bold">{todoCount}</p>
        </div>
        <div className="card bg-gradient-to-br from-accent-500 to-pink-600 border-0 text-white animate-slide-up" style={{ animationDelay: '100ms' }}>
          <p className="text-white/70 font-medium mb-1">In Progress</p>
          <p className="text-4xl font-bold">{inProgressCount}</p>
        </div>
        <div className="card bg-gradient-to-br from-success to-emerald-600 border-0 text-white animate-slide-up" style={{ animationDelay: '200ms' }}>
          <p className="text-white/70 font-medium mb-1">Completed</p>
          <p className="text-4xl font-bold">{completedCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Task Distribution Graph */}
        <div className="card animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="font-semibold text-surface-900 dark:text-white mb-4">My Task Distribution</h3>
          {taskChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={taskChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {taskChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--color-surface-800)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {taskChartData.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-surface-500">{item.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-surface-400 text-sm">
              No task data available
            </div>
          )}
        </div>

        {/* My Recent Tasks Table */}
        <div className="card lg:col-span-2 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900 dark:text-white">My Recent Tasks</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700">
                  <th className="py-3 px-4 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Task Name</th>
                  <th className="py-3 px-4 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Project</th>
                  <th className="py-3 px-4 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Priority</th>
                  <th className="py-3 px-4 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {tasks.slice(0, 5).map(task => (
                  <tr key={task.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-surface-900 dark:text-white">{task.title}</td>
                    <td className="py-3 px-4 text-surface-500 text-xs font-bold uppercase tracking-wider">{task.project?.name || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-surface-700 dark:text-surface-300 capitalize">
                        <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: RAG_COLORS[task.priority === 'critical' ? 'red' : task.priority === 'high' ? 'amber' : 'green'] || '#3b82f6' }} />
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 uppercase tracking-wider">
                        {task.status.replace('-', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr><td colSpan="4" className="py-8 text-center text-surface-400">No tasks assigned to you currently.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const AccountDashboard = ({ user, stats }) => {
  const { data: empData } = useQuery(GET_EMPLOYEES);
  const attendanceData = stats?.monthlyAttendance || [];
  
  // Calculate quick payroll stat
  const netDisbursal = (empData?.employees || []).reduce((acc, emp) => {
    return acc + (emp.salary?.base || 0) + (emp.salary?.bonus || 0) - (emp.salary?.deductions || 0);
  }, 0);

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-surface-400 mt-1">Here is your workforce attendance and financial overview.</p>
        </div>
        <div className="text-sm text-surface-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card bg-gradient-to-br from-primary-600 to-accent-600 border-0 text-white animate-slide-up">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Est. Net Disbursal</p>
              <h3 className="text-3xl font-bold mt-1">{formatCurrency(netDisbursal)}</h3>
            </div>
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur"><DollarSign size={20} /></div>
          </div>
          <p className="mt-3 text-xs text-white/70">Current month projection</p>
        </div>
        <StatCard icon={Users} label="Total Workforce" value={stats?.totalEmployees || 0} change="Active employees" changeType="up" color="bg-gradient-to-br from-blue-500 to-blue-600" delay={100} />
        <StatCard icon={UserCheck} label="Present Today" value={stats?.presentToday || 0} change={`of ${stats?.totalEmployees || 0} total`} changeType="up" color="bg-gradient-to-br from-success to-emerald-600" delay={200} />
        <StatCard icon={CalendarX} label="Pending Leaves" value={stats?.pendingLeaves || 0} change="Requires Review" changeType="down" color="bg-gradient-to-br from-warning to-orange-500" delay={300} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Attendance Trends */}
        <div className="card lg:col-span-2 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Workforce Attendance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={attendanceData}>
              <defs>
                <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-200)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-surface-400)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-surface-400)' }} />
              <Tooltip contentStyle={{ background: 'var(--color-surface-800)', border: 'none', borderRadius: '12px', color: 'white' }} />
              <Area type="monotone" dataKey="present" stroke="#10b981" fill="url(#presentGrad)" strokeWidth={3} name="Present" />
              <Area type="monotone" dataKey="absent" stroke="#ef4444" fill="url(#absentGrad)" strokeWidth={2} name="Absent" />
              <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} dot={false} name="Late" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent HR Activity Feed */}
        <div className="card animate-slide-up flex flex-col" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {(stats?.recentActivities || []).filter(a => ['employee', 'attendance'].includes(a.type)).length === 0 ? (
              <div className="text-center py-10 text-surface-400">
                <Clock className="mx-auto mb-2 opacity-20" size={32} />
                <p className="text-sm">No recent HR/Attendance activities</p>
              </div>
            ) : (
              (stats?.recentActivities || []).filter(a => ['employee', 'attendance'].includes(a.type)).map((activity, i) => (
                <div key={activity.id} className="flex gap-3 items-start">
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    activity.type === 'employee' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }`}>
                    {activity.type.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-700 dark:text-surface-200 leading-snug">
                      <span className="font-semibold text-surface-900 dark:text-white">{activity.user}</span> {activity.message.replace(activity.user, '').trim()}
                    </p>
                    <p className="text-[10px] text-surface-400 mt-1">
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {activity.type}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  
  const isEmployee = user?.role?.toLowerCase() === 'employee';
  const isAccount = ['account', 'accounts'].includes(user?.role?.toLowerCase());

  const { data, loading } = useQuery(GET_DASHBOARD_STATS, { skip: isEmployee });
  const stats = data?.dashboardStats;

  if (isEmployee) {
    return <EmployeeDashboard user={user} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (isAccount) {
    return <AccountDashboard user={user} stats={stats} />;
  }

  const taskChartData = stats?.tasksByStatus?.map(t => ({
    name: t.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: t.count
  })) || [];

  const projectProgressData = stats?.projectProgress || [];
  const attendanceData = stats?.monthlyAttendance || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            Welcome back, {user?.firstName}! 
          </h1>
          <p className="text-surface-400 mt-1">Here's what's happening with your workforce today.</p>
        </div>
        <div className="text-sm text-surface-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={Users} label="Total Employees" value={stats?.totalEmployees || 0} change="+12% from last month" changeType="up" color="bg-gradient-to-br from-primary-500 to-primary-600" delay={0} />
        <StatCard icon={FolderKanban} label="Active Projects" value={stats?.activeProjects || 0} change="+3 new this week" changeType="up" color="bg-gradient-to-br from-accent-500 to-pink-600" delay={100} />
        <StatCard icon={CheckSquare} label="Pending Tasks" value={stats?.pendingTasks || 0} change="8 due today" changeType="down" color="bg-gradient-to-br from-warning to-orange-500" delay={200} />
        <StatCard icon={UserCheck} label="Present Today" value={stats?.presentToday || 0} change={`of ${stats?.totalEmployees || 0} employees`} changeType="up" color="bg-gradient-to-br from-success to-emerald-600" delay={300} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Project Progress */}
        <div className="card lg:col-span-2 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Project Progress</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={projectProgressData} barRadius={[8, 8, 0, 0]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-200)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-surface-400)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--color-surface-400)' }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface-800)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
              <Bar dataKey="progress" fill="url(#progressGrad)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Distribution */}
        <div className="card animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Task Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={taskChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                {taskChartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--color-surface-800)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '13px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {taskChartData.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-surface-500">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RAG Status & Attendance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* RAG Distribution */}
        <div className="card animate-slide-up" style={{ animationDelay: '400ms' }}>
          <h3 className="font-semibold text-surface-900 dark:text-white mb-4">RAG Status Overview</h3>
          <div className="space-y-4">
            {(stats?.ragDistribution || []).map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <RAGBadge status={item.status} />
                <div className="flex-1 h-3 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(item.count / (stats?.totalProjects || 1)) * 100}%`,
                      background: RAG_COLORS[item.status]
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-surface-600 dark:text-surface-300 min-w-[2rem] text-right">{item.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-primary-500" />
              <p className="text-sm font-semibold text-surface-700 dark:text-surface-200">Quick Summary</p>
            </div>
            <p className="text-xs text-surface-400 leading-relaxed">
              {stats?.ragDistribution?.find(r => r.status === 'red')?.count || 0} projects need immediate attention.
              {stats?.ragDistribution?.find(r => r.status === 'green')?.count || 0} projects are on track.
            </p>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="card animate-slide-up flex flex-col" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-surface-900 dark:text-white">Recent Activity</h3>
            <button className="text-xs text-primary-600 hover:underline">View All</button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
            {(stats?.recentActivities || []).length === 0 ? (
              <div className="text-center py-10 text-surface-400">
                <Clock className="mx-auto mb-2 opacity-20" size={32} />
                <p className="text-sm">No recent activities</p>
              </div>
            ) : (
              (stats?.recentActivities || []).map((activity, i) => (
                <div key={activity.id} className="flex gap-3 items-start animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    activity.type === 'employee' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                    activity.type === 'project' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                    activity.type === 'attendance' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'
                  }`}>
                    {activity.type.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-700 dark:text-surface-200 leading-snug">
                      <span className="font-semibold text-surface-900 dark:text-white">{activity.user}</span> {activity.message.replace(activity.user, '').trim()}
                    </p>
                    <p className="text-[10px] text-surface-400 mt-1">
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {activity.type}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Monthly Attendance Row */}
      <div className="card animate-slide-up" style={{ animationDelay: '600ms' }}>
        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Monthly Attendance Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={attendanceData}>
            <defs>
              <linearGradient id="attendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-surface-200)" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-surface-400)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--color-surface-400)' }} />
            <Tooltip contentStyle={{ background: 'var(--color-surface-800)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '13px' }} />
            <Area type="monotone" dataKey="present" stroke="#10b981" fill="url(#attendGrad)" strokeWidth={2} />
            <Line type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row - Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card text-center animate-slide-up" style={{ animationDelay: '700ms' }}>
          <Briefcase className="mx-auto mb-2 text-primary-500" size={28} />
          <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats?.totalClients || 0}</p>
          <p className="text-sm text-surface-400">Total Clients</p>
        </div>
        <div className="card text-center animate-slide-up" style={{ animationDelay: '800ms' }}>
          <CalendarX className="mx-auto mb-2 text-warning" size={28} />
          <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats?.pendingLeaves || 0}</p>
          <p className="text-sm text-surface-400">Pending Leaves</p>
        </div>
        <div className="card text-center animate-slide-up" style={{ animationDelay: '900ms' }}>
          <Clock className="mx-auto mb-2 text-accent-500" size={28} />
          <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats?.totalProjects || 0}</p>
          <p className="text-sm text-surface-400">Total Projects</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


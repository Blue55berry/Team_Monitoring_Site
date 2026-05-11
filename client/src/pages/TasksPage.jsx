import { useQuery, useMutation } from "@apollo/client/react";
import { GET_TASKS, UPDATE_TASK, GET_PROJECTS, CREATE_TASK } from '../graphql/operations';
import { useState } from 'react';
import { Plus, Search, Filter, Calendar, Clock, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#94a3b8' },
  { id: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'review', label: 'Review', color: '#f59e0b' },
  { id: 'completed', label: 'Completed', color: '#10b981' }
];

const PRIORITY_COLORS = { low: '#10b981', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };

const TasksPage = () => {
  const { user } = useAuth();
  const [filterProject, setFilterProject] = useState('');
  const [search, setSearch] = useState('');

  const canCreateTask = ['admin', 'manager', 'team_manager', 'leader', 'team_leader'].includes(user?.role?.toLowerCase());

  const { data, loading, refetch } = useQuery(GET_TASKS, {
    variables: { project: filterProject || undefined }
  });
  const { data: projectsData } = useQuery(GET_PROJECTS);
  const [updateTask] = useMutation(UPDATE_TASK);

  const allTasks = (data?.tasks || []).filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase())
  );

  const getTasksByStatus = (status) => allTasks.filter(t => t.status === status);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask({ variables: { id: taskId, input: { status: newStatus.replace('-', '_') } } });
      refetch();
    } catch (err) { console.error(err); }
  };

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', priority: 'medium', projectId: '' });
  const [createTask, { loading: creating }] = useMutation(CREATE_TASK);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTask({ variables: { input: { title: formData.title, priority: formData.priority, project: formData.projectId } } });
      toast.success('Task created successfully!');
      setShowModal(false);
      setFormData({ title: '', priority: 'medium', projectId: '' });
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Task Board</h1>
          <p className="text-surface-400 text-sm mt-1">{allTasks.length} tasks across all projects</p>
        </div>
        {canCreateTask && (
          <button onClick={() => setShowModal(true)} className="btn-primary shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
            <Plus size={18} /> New Task
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." className="input-field pl-10" />
        </div>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="input-field w-auto min-w-[180px]">
          <option value="">All Projects</option>
          {(projectsData?.projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700">
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Task Name</th>
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Project</th>
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Priority</th>
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Assigned To</th>
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Due Date</th>
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px] text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {allTasks.map((task, i) => (
                  <tr key={task.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors animate-slide-up group" style={{ animationDelay: `${i * 30}ms` }}>
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-surface-900 dark:text-white leading-tight">{task.title}</p>
                      {task.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {task.tags.slice(0, 3).map((tag, j) => (
                            <span key={j} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">{tag}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-surface-500 text-xs font-bold uppercase tracking-wider">{task.project?.name || 'N/A'}</td>
                    <td className="py-3.5 px-5">
                      <span className="flex items-center gap-2 text-xs font-bold text-surface-700 dark:text-surface-300 capitalize">
                        <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: PRIORITY_COLORS[task.priority] }} />
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                            {task.assignedTo.userId?.firstName?.[0]}{task.assignedTo.userId?.lastName?.[0]}
                          </div>
                          <span className="text-surface-700 dark:text-surface-200 text-sm font-medium">{task.assignedTo.userId?.firstName} {task.assignedTo.userId?.lastName}</span>
                        </div>
                      ) : <span className="text-surface-400 text-xs font-medium italic">Unassigned</span>}
                    </td>
                    <td className="py-3.5 px-5">
                      {task.dueDate ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-surface-500">
                          <Calendar size={13} className="text-surface-400" />
                          {new Date(parseInt(task.dueDate) || task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      ) : <span className="text-surface-400 text-xs">-</span>}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className="text-xs py-1.5 pl-3 pr-8 rounded-lg font-bold border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                      >
                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {allTasks.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-surface-400">
                      <p className="font-medium">No tasks found matching your criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">Create Task</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Task Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} 
                  className="input-field" 
                  placeholder="e.g. Design Homepage"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Project</label>
                  <select 
                    value={formData.projectId} 
                    onChange={e => setFormData(p => ({ ...p, projectId: e.target.value }))} 
                    className="input-field" 
                  >
                    <option value="">Select Project</option>
                    {(projectsData?.projects || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Priority</label>
                  <select 
                    value={formData.priority} 
                    onChange={e => setFormData(p => ({ ...p, priority: e.target.value }))} 
                    className="input-field" 
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1 justify-center">{creating ? 'Creating...' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;


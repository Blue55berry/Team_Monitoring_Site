import { useQuery, useMutation } from "@apollo/client/react";
import { GET_PROJECTS, DELETE_PROJECT } from '../graphql/operations';
import { useState, useEffect } from 'react';
import { Plus, Search, FolderKanban, Calendar, Users, TrendingUp, Trash2, Edit3, ExternalLink, Briefcase } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const RAG_COLORS = { green: '#10b981', amber: '#f59e0b', red: '#ef4444' };
const STATUS_COLORS = { planning: '#8b5cf6', active: '#3b82f6', 'on-hold': '#f59e0b', completed: '#10b981', cancelled: '#ef4444' };
const PRIORITY_COLORS = { low: '#10b981', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444' };

const ProjectsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '');
  const navigate = useNavigate();

  useEffect(() => {
    setFilterStatus(searchParams.get('status') || '');
  }, [searchParams]);

  const handleFilterChange = (e) => {
    const val = e.target.value;
    setFilterStatus(val);
    if (val) {
      searchParams.set('status', val);
    } else {
      searchParams.delete('status');
    }
    setSearchParams(searchParams);
  };

  const { data, loading, refetch } = useQuery(GET_PROJECTS, {
    variables: { status: filterStatus || undefined }
  });
  const [deleteProject] = useMutation(DELETE_PROJECT);

  const projects = (data?.projects || []).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await deleteProject({ variables: { id } });
      toast.success('Project deleted');
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  const daysLeft = (deadline) => {
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Projects</h1>
          <p className="text-surface-400 text-sm mt-1">{projects.length} projects tracked</p>
        </div>
        <button className="btn-primary"><Plus size={18} /> New Project</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="input-field pl-10" />
        </div>
        <select value={filterStatus} onChange={handleFilterChange} className="input-field w-auto">
          <option value="">All Status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
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
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Project Info</th>
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Status & Priority</th>
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Progress</th>
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Team & Deadline</th>
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {projects.map((project, i) => {
                  const days = daysLeft(project.deadline);
                  return (
                    <tr key={project.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer animate-slide-up group" style={{ animationDelay: `${i * 30}ms` }} onClick={() => navigate(`/projects/${project.id}`)}>
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <p className="font-bold text-surface-900 dark:text-white leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{project.name}</p>
                          {project.client && <p className="text-[11px] font-medium text-surface-400 mt-1 flex items-center gap-1"><Briefcase size={11} className="text-surface-300"/>{project.client.companyName}</p>}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold capitalize tracking-wider" style={{ background: `${STATUS_COLORS[project.status]}15`, color: STATUS_COLORS[project.status] }}>
                            {project.status.replace('-', ' ')}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold capitalize tracking-wider" style={{ background: `${PRIORITY_COLORS[project.priority]}15`, color: PRIORITY_COLORS[project.priority] }}>
                            {project.priority}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold rag-${project.ragStatus}`}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: RAG_COLORS[project.ragStatus] }} />
                            {project.ragStatus}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5 min-w-[150px]">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-surface-700 dark:text-surface-200">{project.progress}%</span>
                          {project.taskCount > 0 && <span className="text-[10px] text-surface-400 font-medium">{project.taskCount} tasks</span>}
                        </div>
                        <div className="w-full h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${project.progress}%`, background: `linear-gradient(90deg, ${RAG_COLORS[project.ragStatus]}, ${RAG_COLORS[project.ragStatus]}cc)` }} />
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex -space-x-1.5">
                            {project.team?.slice(0, 3).map((member, j) => (
                              <div key={j} className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 border border-white dark:border-surface-800 flex items-center justify-center text-white text-[9px] font-bold shadow-sm">
                                {member.userId?.firstName?.[0]}{member.userId?.lastName?.[0]}
                              </div>
                            ))}
                            {project.team?.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-surface-200 dark:bg-surface-600 border border-white dark:border-surface-800 flex items-center justify-center text-[9px] font-bold text-surface-500 shadow-sm">
                                +{project.team.length - 3}
                              </div>
                            )}
                          </div>
                          <div className={`flex items-center gap-1 text-[11px] whitespace-nowrap ${days < 0 ? 'text-danger font-semibold' : days < 7 ? 'text-warning font-medium' : 'text-surface-400'}`}>
                            <Calendar size={12} />
                            {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); navigate(`/projects/${project.id}`); }} className="p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"><ExternalLink size={15} /></button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(project.id); }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-danger transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-surface-400">
                      <p className="font-medium">No projects found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;


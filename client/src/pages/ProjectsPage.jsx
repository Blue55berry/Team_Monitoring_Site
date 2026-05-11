import { useQuery, useMutation } from "@apollo/client/react";
import { GET_PROJECTS, DELETE_PROJECT } from '../graphql/operations';
import { useState, useEffect } from 'react';
import { Plus, Search, FolderKanban, Calendar, Users, TrendingUp, Trash2, Edit3, ExternalLink } from 'lucide-react';
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {projects.map((project, i) => {
            const days = daysLeft(project.deadline);
            return (
              <div key={project.id} className="card group cursor-pointer animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}
                onClick={() => navigate(`/projects/${project.id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold capitalize" style={{ background: `${STATUS_COLORS[project.status]}15`, color: STATUS_COLORS[project.status] }}>
                        {project.status.replace('-', ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold capitalize" style={{ background: `${PRIORITY_COLORS[project.priority]}15`, color: PRIORITY_COLORS[project.priority] }}>
                        {project.priority}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{project.name}</h3>
                    {project.description && <p className="text-sm text-surface-400 mt-1 line-clamp-2">{project.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); handleDelete(project.id); }} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-danger">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-surface-400">Progress</span>
                    <span className="font-semibold text-surface-700 dark:text-surface-200">{project.progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${project.progress}%`, background: `linear-gradient(90deg, ${RAG_COLORS[project.ragStatus]}, ${RAG_COLORS[project.ragStatus]}cc)` }} />
                  </div>
                </div>

                {/* Meta Row */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-surface-400">
                      <Calendar size={14} />
                      <span className={days < 0 ? 'text-danger font-semibold' : days < 7 ? 'text-warning' : ''}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                      </span>
                    </div>
                    {project.taskCount > 0 && (
                      <div className="flex items-center gap-1.5 text-surface-400">
                        <TrendingUp size={14} />
                        <span>{project.taskCount} tasks</span>
                      </div>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold rag-${project.ragStatus}`}>
                    <span className="w-2 h-2 rounded-full" style={{ background: RAG_COLORS[project.ragStatus] }} />
                    {project.ragStatus}
                  </span>
                </div>

                {/* Team Avatars */}
                {project.team?.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
                    <div className="flex -space-x-2">
                      {project.team.slice(0, 4).map((member, j) => (
                        <div key={j} className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 border-2 border-white dark:border-surface-800 flex items-center justify-center text-white text-[10px] font-bold">
                          {member.userId?.firstName?.[0]}{member.userId?.lastName?.[0]}
                        </div>
                      ))}
                      {project.team.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-surface-200 dark:bg-surface-600 border-2 border-white dark:border-surface-800 flex items-center justify-center text-xs font-bold text-surface-500">
                          +{project.team.length - 4}
                        </div>
                      )}
                    </div>
                    {project.client && (
                      <span className="ml-auto text-xs text-surface-400">{project.client.companyName}</span>
                    )}
                  </div>
                )}

                {/* Tech Stack */}
                {project.techStack?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {project.techStack.map((tech, k) => (
                      <span key={k} className="px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium">{tech}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;


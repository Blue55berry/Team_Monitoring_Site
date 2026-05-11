import { useQuery, useMutation } from "@apollo/client/react";
import { GET_PROJECT, GET_TASKS, UPDATE_PROJECT, GET_EMPLOYEES } from '../graphql/operations';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, Briefcase, FileText, CheckCircle2, Circle, Edit3, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const RAG_COLORS = { green: '#10b981', amber: '#f59e0b', red: '#ef4444' };
const STATUS_COLORS = { planning: '#8b5cf6', active: '#3b82f6', 'on-hold': '#f59e0b', completed: '#10b981', cancelled: '#ef4444' };

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManager = ['admin', 'manager', 'team_manager', 'leader', 'team_leader'].includes(user?.role?.toLowerCase());

  const { data: projectData, loading: projectLoading, refetch } = useQuery(GET_PROJECT, { variables: { id } });
  const { data: tasksData, loading: tasksLoading } = useQuery(GET_TASKS, { variables: { project: id } });
  const { data: employeesData } = useQuery(GET_EMPLOYEES, { skip: !isManager });
  const [updateProject, { loading: updating }] = useMutation(UPDATE_PROJECT);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ deadline: '', team: [] });

  const project = projectData?.project;

  useEffect(() => {
    if (project && showEditModal) {
      setEditForm({
        deadline: project.deadline ? new Date(parseInt(project.deadline) || project.deadline).toISOString().split('T')[0] : '',
        team: project.team?.map(t => t.id) || []
      });
    }
  }, [project, showEditModal]);

  if (projectLoading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;

  if (!project) return <div className="p-8 text-center text-surface-500">Project not found</div>;

  const tasks = tasksData?.tasks || [];

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProject({
        variables: {
          id: project.id,
          input: {
            name: project.name,
            description: project.description,
            status: project.status,
            priority: project.priority,
            client: project.client?.id,
            deadline: editForm.deadline || undefined,
            team: editForm.team
          }
        }
      });
      toast.success('Project updated successfully!');
      setShowEditModal(false);
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleTeamMember = (empId) => {
    setEditForm(prev => ({
      ...prev,
      team: prev.team.includes(empId) 
        ? prev.team.filter(id => id !== empId)
        : [...prev.team, empId]
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
              {project.name}
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold capitalize" style={{ background: `${STATUS_COLORS[project.status]}15`, color: STATUS_COLORS[project.status] }}>
                {project.status.replace('-', ' ')}
              </span>
            </h1>
            {project.client && <p className="text-surface-500 text-sm mt-1 flex items-center gap-1.5"><Briefcase size={14} /> {project.client.companyName}</p>}
          </div>
        </div>
        {isManager && (
          <button onClick={() => setShowEditModal(true)} className="btn-secondary">
            <Edit3 size={18} /> Edit Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Progress */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2"><FileText size={18} className="text-primary-500" /> Project Documentation & Overview</h3>
            <p className="text-surface-600 dark:text-surface-300 text-sm leading-relaxed mb-6">
              {project.description || 'No description provided.'}
            </p>

            <div className="bg-surface-50 dark:bg-surface-800/50 rounded-xl p-5 border border-surface-100 dark:border-surface-700">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-surface-900 dark:text-white">Completion Progress</span>
                <span className="font-bold text-lg" style={{ color: RAG_COLORS[project.ragStatus] }}>{project.progress}%</span>
              </div>
              <div className="w-full h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden mb-4">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${project.progress}%`, background: `linear-gradient(90deg, ${RAG_COLORS[project.ragStatus]}, ${RAG_COLORS[project.ragStatus]}cc)` }} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div>
                  <p className="text-xs text-surface-500 mb-1">Status Health</p>
                  <p className="font-bold capitalize flex items-center gap-1.5 text-sm">
                    <span className="w-2 h-2 rounded-full" style={{ background: RAG_COLORS[project.ragStatus] }} />
                    {project.ragStatus}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-1">Start Date</p>
                  <p className="font-bold text-surface-900 dark:text-white text-sm">{project.startDate ? new Date(parseInt(project.startDate) || project.startDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-1">Deadline</p>
                  <p className="font-bold text-surface-900 dark:text-white text-sm">{project.deadline ? new Date(parseInt(project.deadline) || project.deadline).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 mb-1">Total Tasks</p>
                  <p className="font-bold text-surface-900 dark:text-white text-sm">{project.taskCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/20">
              <h3 className="font-bold text-surface-900 dark:text-white flex items-center gap-2"><CheckCircle2 size={18} className="text-success" /> Task Tracking</h3>
            </div>
            {tasksLoading ? (
              <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" /></div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center text-surface-500 text-sm">No tasks created for this project yet.</div>
            ) : (
              <ul className="divide-y divide-surface-100 dark:divide-surface-800">
                {tasks.map(task => (
                  <li key={task.id} className="p-4 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {task.status === 'completed' ? <CheckCircle2 size={18} className="text-success" /> : <Circle size={18} className="text-surface-300" />}
                      <div>
                        <p className={`font-semibold text-sm ${task.status === 'completed' ? 'text-surface-400 line-through' : 'text-surface-900 dark:text-white'}`}>{task.title}</p>
                        {task.assignedTo && <p className="text-xs text-surface-500 mt-0.5">Assigned to {task.assignedTo.userId?.firstName}</p>}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300">
                      {task.status.replace('-', ' ')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Team & Tech */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2"><Users size={18} className="text-info" /> Project Team</h3>
            <ul className="space-y-4">
              {project.team?.map(member => (
                <li key={member.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {member.userId?.firstName?.[0]}{member.userId?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-surface-900 dark:text-white">{member.userId?.firstName} {member.userId?.lastName}</p>
                    <p className="text-xs text-surface-500">{member.designation || 'Member'}</p>
                  </div>
                </li>
              ))}
              {!project.team?.length && <li className="text-sm text-surface-500">No team members assigned.</li>}
            </ul>
          </div>

          {project.techStack?.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-surface-900 dark:text-white mb-4 text-sm uppercase tracking-wider text-surface-500">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map(tech => (
                  <span key={tech} className="px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 text-xs font-semibold border border-surface-200 dark:border-surface-700 shadow-sm">{tech}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowEditModal(false)}>
          <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700 flex-shrink-0">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">Edit Project Details</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"><X size={18} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="edit-project-form" onSubmit={handleUpdate} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Project Deadline</label>
                  <input 
                    type="date" 
                    value={editForm.deadline} 
                    onChange={e => setEditForm(p => ({ ...p, deadline: e.target.value }))} 
                    className="input-field" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-3">Assign Team Members</label>
                  <div className="space-y-2 border border-surface-200 dark:border-surface-700 rounded-xl p-3 max-h-[300px] overflow-y-auto">
                    {(employeesData?.employees || []).map(emp => {
                      const isSelected = editForm.team.includes(emp.id);
                      return (
                        <div 
                          key={emp.id} 
                          onClick={() => toggleTeamMember(emp.id)}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50' : 'hover:bg-surface-50 dark:hover:bg-surface-700 border border-transparent'}`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-primary-500 border-primary-500 text-white' : 'border-surface-300 dark:border-surface-600'}`}>
                            {isSelected && <CheckCircle2 size={14} />}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                            {emp.userId?.firstName?.[0]}{emp.userId?.lastName?.[0]}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-surface-900 dark:text-white">{emp.userId?.firstName} {emp.userId?.lastName}</p>
                            <p className="text-xs text-surface-500">{emp.designation}</p>
                          </div>
                        </div>
                      );
                    })}
                    {employeesData?.employees?.length === 0 && (
                      <p className="text-center text-sm text-surface-500 py-4">No employees found.</p>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-surface-200 dark:border-surface-700 flex gap-3 flex-shrink-0">
              <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button type="submit" form="edit-project-form" disabled={updating} className="btn-primary flex-1 justify-center">{updating ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailsPage;

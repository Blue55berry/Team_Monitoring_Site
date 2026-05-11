import { useQuery, useMutation } from "@apollo/client/react";
import { GET_DEPARTMENTS, CREATE_DEPARTMENT } from '../graphql/operations';
import { Plus, Users, DollarSign, Building2, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const DepartmentsPage = () => {
  const { data, loading, refetch } = useQuery(GET_DEPARTMENTS);
  const [createDepartment, { loading: creating }] = useMutation(CREATE_DEPARTMENT);
  const departments = data?.departments || [];

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', budget: '', color: '#6366f1' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createDepartment({ 
        variables: { 
          input: { 
            name: formData.name, 
            description: formData.description, 
            budget: parseFloat(formData.budget) || 0, 
            color: formData.color 
          } 
        } 
      });
      toast.success('Department created successfully!');
      setShowModal(false);
      setFormData({ name: '', description: '', budget: '', color: '#6366f1' });
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Departments</h1>
          <p className="text-surface-400 text-sm mt-1">{departments.length} departments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={18} /> Add Department</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="card p-0 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700">
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Department</th>
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Head</th>
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Employees</th>
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px] text-right">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {departments.map((dept, i) => (
                  <tr key={dept.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors animate-slide-up group" style={{ animationDelay: `${i * 30}ms` }}>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm" style={{ background: `linear-gradient(135deg, ${dept.color}, ${dept.color}cc)` }}>
                          <Building2 size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-surface-900 dark:text-white leading-tight">{dept.name}</p>
                          {dept.description && <p className="text-xs text-surface-500 line-clamp-1 mt-0.5">{dept.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      {dept.head ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                            {dept.head.userId?.firstName?.[0]}{dept.head.userId?.lastName?.[0]}
                          </div>
                          <span className="text-surface-700 dark:text-surface-200 text-sm font-medium">{dept.head.userId?.firstName} {dept.head.userId?.lastName}</span>
                        </div>
                      ) : <span className="text-surface-400 text-xs font-medium italic">Unassigned</span>}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2 text-surface-700 dark:text-surface-300">
                        <Users size={16} className="text-surface-400" />
                        <span className="font-bold">{dept.employeeCount || 0}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span className="font-bold text-surface-900 dark:text-white">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(dept.budget)}
                      </span>
                    </td>
                  </tr>
                ))}
                {departments.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-surface-400">
                      <p className="font-medium">No departments found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">Create Department</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Department Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} 
                  className="input-field" 
                  placeholder="e.g. Engineering"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} 
                  className="input-field min-h-[80px]" 
                  placeholder="Brief description of responsibilities..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Annual Budget (₹)</label>
                  <input 
                    type="number" 
                    value={formData.budget} 
                    onChange={e => setFormData(p => ({ ...p, budget: e.target.value }))} 
                    className="input-field" 
                    placeholder="e.g. 500000"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Theme Color</label>
                  <input 
                    type="color" 
                    value={formData.color} 
                    onChange={e => setFormData(p => ({ ...p, color: e.target.value }))} 
                    className="h-10 w-full rounded-lg cursor-pointer border border-surface-200 dark:border-surface-700" 
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1 justify-center">{creating ? 'Creating...' : 'Create Department'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;


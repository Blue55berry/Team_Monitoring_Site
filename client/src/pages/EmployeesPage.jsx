import { useQuery, useMutation } from "@apollo/client/react";
import { GET_EMPLOYEES, DELETE_EMPLOYEE, GET_DEPARTMENTS } from '../graphql/operations';
import { useState } from 'react';
import { Plus, Search, Filter, Trash2, Edit3, Eye, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import EmployeeModal from '../components/employees/EmployeeModal';

const RAG_COLORS = { green: '#10b981', amber: '#f59e0b', red: '#ef4444' };

const EmployeesPage = () => {
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRAG, setFilterRAG] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);

  const { data, loading, refetch } = useQuery(GET_EMPLOYEES, {
    variables: { department: filterDept || undefined, ragStatus: filterRAG || undefined }
  });
  const { data: deptData } = useQuery(GET_DEPARTMENTS);
  const [deleteEmployee] = useMutation(DELETE_EMPLOYEE);

  const employees = (data?.employees || []).filter(emp => {
    if (!search) return true;
    const name = `${emp.userId.firstName} ${emp.userId.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase()) || emp.employeeId.toLowerCase().includes(search.toLowerCase());
  });

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this employee?')) return;
    try {
      await deleteEmployee({ variables: { id } });
      toast.success('Employee removed');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Employees</h1>
          <p className="text-surface-400 text-sm mt-1">{employees.length} team members</p>
        </div>
        <button onClick={() => { setEditEmployee(null); setShowModal(true); }} className="btn-primary">
          <Plus size={18} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..." className="input-field pl-10" />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="input-field w-auto min-w-[160px]">
          <option value="">All Departments</option>
          {(deptData?.departments || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={filterRAG} onChange={e => setFilterRAG(e.target.value)} className="input-field w-auto min-w-[140px]">
          <option value="">All Status</option>
          <option value="green">🟢 Green</option>
          <option value="amber">🟠 Amber</option>
          <option value="red">🔴 Red</option>
        </select>
      </div>

      {/* Employee Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-20 text-surface-400">
          <Users size={48} className="mx-auto mb-4 opacity-40" />
          <p className="text-lg font-medium">No employees found</p>
          <p className="text-sm">Try adjusting your filters or add a new employee</p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/20">
                <th className="py-3 px-4 text-surface-400 font-medium">Employee</th>
                <th className="py-3 px-4 text-surface-400 font-medium">Department</th>
                <th className="py-3 px-4 text-surface-400 font-medium">Status</th>
                <th className="py-3 px-4 text-surface-400 font-medium">Performance</th>
                <th className="py-3 px-4 text-surface-400 font-medium">Skills</th>
                <th className="py-3 px-4 text-surface-400 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr key={emp.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 animate-slide-up group" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {emp.userId.firstName[0]}{emp.userId.lastName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-surface-900 dark:text-white">{emp.userId.firstName} {emp.userId.lastName}</h3>
                          {emp.userId.role !== 'employee' && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                              emp.userId.role === 'admin' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                              emp.userId.role === 'hr' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                              'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {emp.userId.role}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-surface-400">{emp.employeeId} • {emp.designation}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium" style={{ background: `${emp.department?.color}15`, color: emp.department?.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: emp.department?.color }} />
                      {emp.department?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold rag-${emp.ragStatus}`}>
                      <span className="w-2 h-2 rounded-full" style={{ background: RAG_COLORS[emp.ragStatus] }} />
                      {emp.ragStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${emp.performanceScore}%`, background: emp.performanceScore >= 70 ? '#10b981' : emp.performanceScore >= 50 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <span className="font-medium text-surface-600 dark:text-surface-300 text-xs">{emp.performanceScore}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {emp.skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {emp.skills.slice(0, 2).map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-700 text-xs text-surface-500">{s}</span>
                        ))}
                        {emp.skills.length > 2 && (
                          <span className="px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-700 text-xs text-surface-400">+{emp.skills.length - 2}</span>
                        )}
                      </div>
                    ) : <span className="text-xs text-surface-400">No skills listed</span>}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditEmployee(emp); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-danger transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <EmployeeModal
          employee={editEmployee}
          departments={deptData?.departments || []}
          onClose={() => { setShowModal(false); setEditEmployee(null); }}
          onSuccess={() => { setShowModal(false); setEditEmployee(null); refetch(); }}
        />
      )}
    </div>
  );
};

// need to import Users for empty state
import { Users } from 'lucide-react';

export default EmployeesPage;


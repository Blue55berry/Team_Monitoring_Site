import { useQuery } from "@apollo/client/react";
import { GET_DEPARTMENTS } from '../graphql/operations';
import { Plus, Users, DollarSign, Building2 } from 'lucide-react';

const DepartmentsPage = () => {
  const { data, loading } = useQuery(GET_DEPARTMENTS);
  const departments = data?.departments || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Departments</h1>
          <p className="text-surface-400 text-sm mt-1">{departments.length} departments</p>
        </div>
        <button className="btn-primary"><Plus size={18} /> Add Department</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {departments.map((dept, i) => (
            <div key={dept.id} className="card animate-slide-up group hover:scale-[1.02]" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold" style={{ background: `linear-gradient(135deg, ${dept.color}, ${dept.color}cc)` }}>
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white">{dept.name}</h3>
                  {dept.description && <p className="text-xs text-surface-400 line-clamp-1">{dept.description}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 text-center">
                  <Users size={18} className="mx-auto mb-1 text-surface-400" />
                  <p className="text-lg font-bold text-surface-900 dark:text-white">{dept.employeeCount || 0}</p>
                  <p className="text-xs text-surface-400">Employees</p>
                </div>
                <div className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 text-center">
                  <DollarSign size={18} className="mx-auto mb-1 text-surface-400" />
                  <p className="text-lg font-bold text-surface-900 dark:text-white">${(dept.budget / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-surface-400">Budget</p>
                </div>
              </div>

              {dept.head && (
                <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-[10px] font-bold">
                    {dept.head.userId?.firstName?.[0]}{dept.head.userId?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-surface-700 dark:text-surface-200">{dept.head.userId?.firstName} {dept.head.userId?.lastName}</p>
                    <p className="text-[10px] text-surface-400">Department Head</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;


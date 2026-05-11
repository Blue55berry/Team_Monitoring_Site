import { Calculator, DollarSign, Download, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const PayrollPage = () => {
  const { user } = useAuth();

  // Basic role protection check for UI components directly rendering this page
  if (!['admin', 'account'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Salary & Accounts</h1>
          <p className="text-surface-400 text-sm mt-1">Manage employee payroll, processing, and financial reporting.</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Download size={18} /> Export Payroll Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card bg-gradient-to-br from-primary-500 to-accent-600 border-0 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Total Monthly Payroll</p>
              <h3 className="text-3xl font-bold mt-1">$142,500</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur"><DollarSign size={24} /></div>
          </div>
          <div className="mt-4 text-sm text-white/80">Pending Disbursal</div>
        </div>
        <div className="card">
           <p className="text-surface-500 text-sm font-medium">Processed Salaries</p>
           <h3 className="text-2xl font-bold mt-1 text-surface-900 dark:text-white">124</h3>
           <p className="text-xs text-success mt-2 font-medium">+12 this month</p>
        </div>
        <div className="card">
           <p className="text-surface-500 text-sm font-medium">Pending Approvals</p>
           <h3 className="text-2xl font-bold mt-1 text-surface-900 dark:text-white">5</h3>
           <p className="text-xs text-warning mt-2 font-medium">Requires Admin Sign-off</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
           <h3 className="font-semibold text-surface-900 dark:text-white">Employee Salary Matrix</h3>
           <div className="relative">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
             <input placeholder="Search records..." className="input-field pl-9 py-1.5 text-sm w-64" />
           </div>
        </div>
        <div className="py-20 text-center text-surface-400">
           <Calculator size={48} className="mx-auto mb-4 opacity-40" />
           <p className="font-medium text-lg">Accounts module initialization.</p>
           <p className="text-sm">Detailed payroll matrix will be populated here.</p>
        </div>
      </div>
    </div>
  );
};

export default PayrollPage;

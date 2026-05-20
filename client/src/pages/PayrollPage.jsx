import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { GET_EMPLOYEES, UPDATE_EMPLOYEE } from '../graphql/operations';
import { Calculator, DollarSign, Download, Search, TrendingUp, TrendingDown, Building2, User, ChevronRight, CheckCircle2, Edit2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PayrollPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({ base: 0, bonus: 0, deductions: 0 });
  const [toast, setToast] = useState(null);

  // Protect route
  if (!['admin', 'account'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const { data, loading, error } = useQuery(GET_EMPLOYEES);
  const [updateEmployee, { loading: updating }] = useMutation(UPDATE_EMPLOYEE, {
    refetchQueries: [{ query: GET_EMPLOYEES }]
  });

  const employees = data?.employees || [];

  // Computed Real-time Metrics
  const metrics = useMemo(() => {
    let totalBase = 0;
    let totalBonus = 0;
    let totalDeductions = 0;

    employees.forEach(emp => {
      const base = emp.salary?.base || 0;
      const bonus = emp.salary?.bonus || 0;
      const deductions = emp.salary?.deductions || 0;
      const presentDays = emp.attendanceSummary?.presentDays || 0;
      const totalDays = emp.attendanceSummary?.totalDays || 30;
      const proratedBase = totalDays > 0 ? (base * (presentDays / totalDays)) : 0;
      const net = proratedBase + bonus - deductions;

      totalBase += proratedBase;
      totalBonus += bonus;
      totalDeductions += deductions;

    });

    return {
      netDisbursal: totalBase + totalBonus - totalDeductions,
      totalBase,
      totalBonus,
      totalDeductions
    };
  }, [employees]);

  const filteredEmployees = employees.filter(emp => 
    `${emp.userId?.firstName} ${emp.userId?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const handleExport = () => {
    const doc = new jsPDF();
    
    // Default jsPDF fonts don't support the Unicode ₹ symbol, causing spacing issues and rendering artifacts
    const pdfFormatCurrency = (val) => 'Rs. ' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);

    doc.setFontSize(16);
    doc.text('WorkForce Intelligence - Live Payroll Report', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Net Disbursal: ${pdfFormatCurrency(metrics.netDisbursal)}`, 14, 22);

    const tableData = filteredEmployees.map(emp => {
      const base = emp.salary?.base || 0;
      const bonus = emp.salary?.bonus || 0;
      const deductions = emp.salary?.deductions || 0;
      const presentDays = emp.attendanceSummary?.presentDays || 0;
      const totalDays = emp.attendanceSummary?.totalDays || 30;
      const proratedBase = totalDays > 0 ? (base * (presentDays / totalDays)) : 0;
      const net = proratedBase + bonus - deductions;
      return [
        `${emp.userId?.firstName} ${emp.userId?.lastName} (${emp.userId?.role?.replace('_', ' ') || 'employee'})`,
        `${presentDays}/${totalDays} Days`,
        pdfFormatCurrency(proratedBase),
        `+${pdfFormatCurrency(bonus)}`,
        `-${pdfFormatCurrency(deductions)}`,
        pdfFormatCurrency(net)
      ];
    });

    autoTable(doc, {
      startY: 30,
      head: [['Employee Name', 'Attendance', 'Prorated Base', 'Bonuses', 'Deductions', 'Net Payable']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right', textColor: [16, 185, 129] },
        4: { halign: 'right', textColor: [239, 68, 68] },
        5: { halign: 'right', fontStyle: 'bold' }
      }
    });

    doc.save(`Payroll_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleEditClick = (emp) => {
    setEditingEmployee(emp);
    setEditForm({
      base: emp.salary?.base || 0,
      bonus: emp.salary?.bonus || 0,
      deductions: emp.salary?.deductions || 0,
    });
  };

  const handleSaveSalary = async (e) => {
    e.preventDefault();
    try {
      await updateEmployee({
        variables: {
          id: editingEmployee.id,
          input: {
            designation: editingEmployee.designation, // Required by schema
            salary: {
              base: parseFloat(editForm.base),
              bonus: parseFloat(editForm.bonus),
              deductions: parseFloat(editForm.deductions),
            }
          }
        }
      });
      setEditingEmployee(null);
      setToast({ type: 'success', message: 'Salary details updated successfully!' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast({ type: 'error', message: err.message || 'Failed to update salary' });
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  if (error) return <div className="p-8 text-center text-danger">Failed to load payroll data.</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Live Accounts & Payroll</h1>
          <p className="text-surface-400 text-sm mt-1">Real-time department-wise financial processing and salary matrix.</p>
        </div>
        <button onClick={handleExport} className="btn-primary flex items-center gap-2">
          <Download size={18} /> Export Payroll Report
        </button>
      </div>

      {/* Top Level Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="card col-span-1 md:col-span-2 bg-gradient-to-br from-primary-600 to-accent-600 border-0 text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-white/80 text-sm font-medium tracking-wide uppercase">Net Monthly Disbursal</p>
              <h3 className="text-4xl font-extrabold mt-2 tracking-tight">{formatCurrency(metrics.netDisbursal)}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur shadow-inner shadow-white/20">
              <DollarSign size={28} className="text-white" />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between text-sm border-t border-white/20 pt-4 relative z-10">
            <span className="text-white/80">Pending Final Approval</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur">Cycle: Current Month</span>
          </div>
        </div>

        <div className="card flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-success/10 text-success rounded-xl"><TrendingUp size={20} /></div>
            <p className="text-surface-500 text-sm font-medium">Total Bonuses</p>
          </div>
          <h3 className="text-2xl font-bold text-surface-900 dark:text-white">{formatCurrency(metrics.totalBonus)}</h3>
          <p className="text-xs text-surface-400 mt-2 font-medium">Performance incentives & overtime</p>
        </div>

        <div className="card flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-danger/10 text-danger rounded-xl"><TrendingDown size={20} /></div>
            <p className="text-surface-500 text-sm font-medium">Total Deductions</p>
          </div>
          <h3 className="text-2xl font-bold text-surface-900 dark:text-white">{formatCurrency(metrics.totalDeductions)}</h3>
          <p className="text-xs text-surface-400 mt-2 font-medium">Taxes, absences & adjustments</p>
        </div>
      </div>

      <div className="w-full">
        {/* Detailed Salary Matrix */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="font-bold text-lg text-surface-900 dark:text-white flex items-center gap-2">
              <Calculator size={20} className="text-accent-500" />
              Employee Salary Matrix
            </h3>
            <div className="relative w-full sm:w-auto">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input 
                placeholder="Search employee or dept..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input-field pl-9 py-2 text-sm w-full sm:w-64 bg-white dark:bg-surface-800 shadow-sm" 
              />
            </div>
          </div>

          <div className="card p-0 overflow-hidden border border-surface-200 dark:border-surface-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-50 dark:bg-surface-800/50 text-surface-500 dark:text-surface-400 border-b border-surface-200 dark:border-surface-800">
                  <tr>
                    <th className="py-3 px-4 font-medium whitespace-nowrap">Employee</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap text-center">Attendance</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap text-right">Base Salary</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap text-right">Bonuses</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap text-right">Deductions</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap text-right">Net Payable</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800/50">
                  {filteredEmployees.map(emp => {
                    const base = emp.salary?.base || 0;
                    const bonus = emp.salary?.bonus || 0;
                    const deductions = emp.salary?.deductions || 0;
                    const presentDays = emp.attendanceSummary?.presentDays || 0;
                    const totalDays = emp.attendanceSummary?.totalDays || 30;
                    const proratedBase = totalDays > 0 ? (base * (presentDays / totalDays)) : 0;
                    const net = proratedBase + bonus - deductions;

                    return (
                      <tr key={emp.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {emp.userId?.avatar ? (
                              <img src={emp.userId.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-xs font-bold">
                                {emp.userId?.firstName?.[0]}{emp.userId?.lastName?.[0]}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-surface-900 dark:text-white group-hover:text-primary-600 transition-colors">{emp.userId?.firstName} {emp.userId?.lastName}</p>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 capitalize border border-surface-200 dark:border-surface-600">
                                  {emp.userId?.role?.replace('_', ' ') || 'employee'}
                                </span>
                              </div>
                              <p className="text-xs text-surface-500">{emp.designation || 'Staff'} • {emp.department?.name || 'No Dept'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 px-2 py-1 rounded-md inline-block">
                            {presentDays} / {totalDays} Days
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-surface-600 dark:text-surface-300 whitespace-nowrap">
                          {formatCurrency(proratedBase)}
                          <div className="text-[10px] text-surface-400 mt-0.5">Fixed: {formatCurrency(base)}</div>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="text-success font-medium bg-success/10 px-2 py-0.5 rounded text-xs">+{formatCurrency(bonus)}</span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="text-danger font-medium bg-danger/10 px-2 py-0.5 rounded text-xs">-{formatCurrency(deductions)}</span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="font-bold text-surface-900 dark:text-white">{formatCurrency(net)}</span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleEditClick(emp)} className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 rounded-lg transition-colors" title="Edit Salary">
                              <Edit2 size={16} />
                            </button>
                            <button className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-primary-600 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold" title="Process Payment">
                              <CheckCircle2 size={16} /> Process
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-surface-400">
                        <User size={32} className="mx-auto mb-3 opacity-20" />
                        <p>No employee records found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Salary Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setEditingEmployee(null)}>
          <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-surface-100 dark:border-surface-700">
              <h2 className="text-xl font-bold text-surface-900 dark:text-white">Edit Salary Details</h2>
              <button onClick={() => setEditingEmployee(null)} className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg text-surface-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 bg-surface-50 dark:bg-surface-800/50 flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold">
                 {editingEmployee.userId?.firstName?.[0]}{editingEmployee.userId?.lastName?.[0]}
               </div>
               <div>
                 <p className="font-semibold text-surface-900 dark:text-white">{editingEmployee.userId?.firstName} {editingEmployee.userId?.lastName}</p>
                 <p className="text-xs text-surface-500">{editingEmployee.designation}</p>
               </div>
            </div>

            <form onSubmit={handleSaveSalary} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Base Salary (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 font-medium">₹</span>
                  <input type="number" min="0" step="100" value={editForm.base} onChange={e => setEditForm({...editForm, base: e.target.value})} className="input-field pl-8" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-success mb-1">Bonuses / Overtime (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-success font-medium">+</span>
                  <input type="number" min="0" step="100" value={editForm.bonus} onChange={e => setEditForm({...editForm, bonus: e.target.value})} className="input-field pl-8 focus:border-success focus:ring-success/20" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-danger mb-1">Deductions / Taxes (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-danger font-medium">-</span>
                  <input type="number" min="0" step="100" value={editForm.deductions} onChange={e => setEditForm({...editForm, deductions: e.target.value})} className="input-field pl-8 focus:border-danger focus:ring-danger/20" required />
                </div>
              </div>
              
              <div className="bg-surface-50 dark:bg-surface-800/50 p-4 rounded-xl mt-6 flex items-center justify-between">
                 <span className="font-semibold text-surface-700 dark:text-surface-300">New Net Payable (Projected)</span>
                 <span className="text-xl font-bold text-surface-900 dark:text-white">
                   {(() => {
                     const presentDays = editingEmployee.attendanceSummary?.presentDays || 0;
                     const totalDays = editingEmployee.attendanceSummary?.totalDays || 30;
                     const prorated = totalDays > 0 ? (parseFloat(editForm.base || 0) * (presentDays / totalDays)) : 0;
                     return formatCurrency(prorated + parseFloat(editForm.bonus || 0) - parseFloat(editForm.deductions || 0));
                   })()}
                 </span>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingEmployee(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={updating} className="btn-primary flex-1 justify-center">{updating ? 'Saving...' : 'Save Updates'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Centered Toast Alert */}
      {toast && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/20 animate-fade-in">
          <div className={`px-6 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 animate-slide-up max-w-sm w-full text-center border-t-4 ${toast.type === 'success' ? 'bg-white dark:bg-surface-800 border-success text-surface-900 dark:text-white' : 'bg-white dark:bg-surface-800 border-danger text-surface-900 dark:text-white'}`}>
            <div className={`p-3 rounded-full ${toast.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={32} /> : <X size={32} />}
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">{toast.type === 'success' ? 'Success!' : 'Action Failed'}</h3>
              <p className="text-sm text-surface-500 font-medium">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className={`mt-2 w-full py-2.5 rounded-lg font-bold text-white transition-colors ${toast.type === 'success' ? 'bg-success hover:bg-success/90 shadow-lg shadow-success/20' : 'bg-danger hover:bg-danger/90 shadow-lg shadow-danger/20'}`}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPage;

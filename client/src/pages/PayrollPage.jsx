import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_EMPLOYEES } from '../graphql/operations';
import { Calculator, DollarSign, Download, Search, TrendingUp, TrendingDown, Building2, User, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PayrollPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Protect route
  if (!['admin', 'account'].includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const { data, loading, error } = useQuery(GET_EMPLOYEES);

  const employees = data?.employees || [];

  // Computed Real-time Metrics
  const metrics = useMemo(() => {
    let totalBase = 0;
    let totalBonus = 0;
    let totalDeductions = 0;
    const departmentCost = {};

    employees.forEach(emp => {
      const base = emp.salary?.base || 0;
      const bonus = emp.salary?.bonus || 0;
      const deductions = emp.salary?.deductions || 0;
      const net = base + bonus - deductions;

      totalBase += base;
      totalBonus += bonus;
      totalDeductions += deductions;

      const deptName = emp.department?.name || 'Unassigned';
      if (!departmentCost[deptName]) {
        departmentCost[deptName] = { total: 0, count: 0, color: emp.department?.color || '#3b82f6' };
      }
      departmentCost[deptName].total += net;
      departmentCost[deptName].count += 1;
    });

    return {
      netDisbursal: totalBase + totalBonus - totalDeductions,
      totalBase,
      totalBonus,
      totalDeductions,
      departmentCost: Object.entries(departmentCost).sort((a, b) => b[1].total - a[1].total)
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
      const net = base + bonus - deductions;
      return [
        `${emp.userId?.firstName} ${emp.userId?.lastName}`,
        emp.department?.name || 'N/A',
        pdfFormatCurrency(base),
        `+${pdfFormatCurrency(bonus)}`,
        `-${pdfFormatCurrency(deductions)}`,
        pdfFormatCurrency(net)
      ];
    });

    autoTable(doc, {
      startY: 30,
      head: [['Employee Name', 'Department', 'Base Salary', 'Bonuses', 'Deductions', 'Net Payable']],
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Department Wise Cost Breakdown */}
        <div className="xl:col-span-1 space-y-4">
          <h3 className="font-bold text-lg text-surface-900 dark:text-white flex items-center gap-2">
            <Building2 size={20} className="text-primary-500" />
            Department Wise Cost
          </h3>
          <div className="card p-0 overflow-hidden border border-surface-200 dark:border-surface-800">
            <div className="divide-y divide-surface-100 dark:divide-surface-800/50 max-h-[500px] overflow-y-auto custom-scrollbar">
              {metrics.departmentCost.map(([dept, stats]) => (
                <div key={dept} className="p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-surface-900 dark:text-white text-sm">{dept}</h4>
                    <p className="text-xs text-surface-500 mt-1">{stats.count} Employees</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-surface-900 dark:text-white">{formatCurrency(stats.total)}</p>
                    <div className="w-24 h-1.5 bg-surface-100 dark:bg-surface-800 rounded-full mt-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(stats.total / metrics.netDisbursal) * 100}%`, backgroundColor: stats.color }} />
                    </div>
                  </div>
                </div>
              ))}
              {metrics.departmentCost.length === 0 && (
                <div className="p-8 text-center text-surface-400 text-sm">No department data available.</div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Salary Matrix */}
        <div className="xl:col-span-2 space-y-4">
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
                    <th className="py-3 px-4 font-medium whitespace-nowrap text-right">Base Salary</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap text-right">Bonuses</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap text-right">Deductions</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap text-right">Net Payable</th>
                    <th className="py-3 px-4 font-medium whitespace-nowrap text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800/50">
                  {filteredEmployees.map(emp => {
                    const base = emp.salary?.base || 0;
                    const bonus = emp.salary?.bonus || 0;
                    const deductions = emp.salary?.deductions || 0;
                    const net = base + bonus - deductions;

                    return (
                      <tr key={emp.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {emp.userId?.avatar ? (
                              <img src={emp.userId.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-xs font-bold">
                                {emp.userId?.firstName?.[0]}{emp.userId?.lastName?.[0]}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-surface-900 dark:text-white group-hover:text-primary-600 transition-colors">{emp.userId?.firstName} {emp.userId?.lastName}</p>
                              <p className="text-xs text-surface-500">{emp.department?.name || 'No Dept'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-surface-600 dark:text-surface-300">
                          {formatCurrency(base)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-success font-medium bg-success/10 px-2 py-0.5 rounded text-xs">+{formatCurrency(bonus)}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-danger font-medium bg-danger/10 px-2 py-0.5 rounded text-xs">-{formatCurrency(deductions)}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-surface-900 dark:text-white">{formatCurrency(net)}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button className="p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-primary-600 rounded-lg transition-colors mx-auto flex items-center gap-1 text-xs font-semibold">
                            <CheckCircle2 size={16} /> Process
                          </button>
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
    </div>
  );
};

export default PayrollPage;

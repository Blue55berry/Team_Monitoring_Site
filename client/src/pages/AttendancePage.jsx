import { useQuery, useMutation } from "@apollo/client/react";
import { GET_TODAY_ATTENDANCE, GET_MY_ATTENDANCE, CHECK_IN, CHECK_OUT, GET_ATTENDANCE_RECORDS, GET_DEPARTMENTS } from '../graphql/operations';
import { useAuth } from '../context/AuthContext';
import { Clock, LogIn, LogOut, Calendar, CheckCircle, XCircle, AlertTriangle, Building2, Search, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

const STATUS_CONFIG = {
  present: { icon: CheckCircle, color: '#10b981', bg: 'bg-success/10', label: 'Present' },
  absent: { icon: XCircle, color: '#ef4444', bg: 'bg-danger/10', label: 'Absent' },
  late: { icon: AlertTriangle, color: '#f59e0b', bg: 'bg-warning/10', label: 'Late' },
  'half-day': { icon: Clock, color: '#3b82f6', bg: 'bg-info/10', label: 'Half Day' },
  leave: { icon: Calendar, color: '#8b5cf6', bg: 'bg-accent-500/10', label: 'On Leave' }
};

const formatTime = (ts) => {
  if (!ts) return '--:--';
  const d = new Date(parseInt(ts) || ts);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const AdminAttendanceView = () => {
  const [selectedDept, setSelectedDept] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const year = parseInt(selectedMonth.split('-')[0]);
  const month = parseInt(selectedMonth.split('-')[1]) - 1;
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const { data: recordsData, loading: recordsLoading } = useQuery(GET_ATTENDANCE_RECORDS, {
    variables: { startDate: startOfMonth.toISOString(), endDate: endOfMonth.toISOString() },
    fetchPolicy: 'network-only'
  });
  const { data: deptsData } = useQuery(GET_DEPARTMENTS);

  const records = recordsData?.attendanceRecords || [];
  const departments = deptsData?.departments || [];

  const filteredRecords = records.filter(r => {
    const matchesDept = selectedDept ? r.employee?.department?.id === selectedDept : true;
    const empName = `${r.employee?.userId?.firstName} ${r.employee?.userId?.lastName}`.toLowerCase();
    const matchesSearch = empName.includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const employeeMap = {};
  filteredRecords.forEach(record => {
    const empId = record.employee?.id;
    if (!empId) return;
    if (!employeeMap[empId]) {
      employeeMap[empId] = { employee: record.employee, records: {} };
    }
    const day = new Date(parseInt(record.date) || record.date).getDate();
    employeeMap[empId].records[day] = record.status;
  });
  const employeeRows = Object.values(employeeMap);

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text(`Attendance Report - ${selectedMonth}`, 14, 15);
    
    const head = [['Employee', 'Dept', ...daysArray.map(d => d.toString())]];
    const body = employeeRows.map(row => {
      const empName = `${row.employee?.userId?.firstName} ${row.employee?.userId?.lastName}`;
      const dept = row.employee?.department?.name || 'N/A';
      const daysData = daysArray.map(d => {
        const s = row.records[d];
        if (s === 'present') return 'P';
        if (s === 'late') return 'L';
        if (s === 'absent') return 'A';
        if (s === 'half-day') return 'H';
        if (s === 'leave') return 'V';
        return '-';
      });
      return [empName, dept, ...daysData];
    });

    doc.autoTable({
      startY: 25,
      head,
      body,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1, halign: 'center' },
      columnStyles: {
        0: { halign: 'left', cellWidth: 35 },
        1: { halign: 'left', cellWidth: 25 }
      },
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Attendance_${selectedMonth}.pdf`);
  };

  const exportEmployeePDF = (row) => {
    const doc = new jsPDF();
    const empName = `${row.employee?.userId?.firstName} ${row.employee?.userId?.lastName}`;
    doc.text(`Attendance Report - ${empName} - ${selectedMonth}`, 14, 15);
    
    const empRecords = filteredRecords.filter(r => r.employee?.id === row.employee.id);
    const tableData = empRecords.map(r => [
      new Date(parseInt(r.date) || r.date).toLocaleDateString(),
      formatTime(r.checkIn),
      formatTime(r.checkOut),
      `${r.workHours?.toFixed(1) || '0'}h`,
      r.status
    ]);

    doc.autoTable({
      startY: 25,
      head: [['Date', 'Check In', 'Check Out', 'Hours', 'Status']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Attendance_${empName.replace(/\s+/g, '_')}_${selectedMonth}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Attendance Overview</h1>
          <p className="text-surface-400 text-sm mt-1">Month-wise and department-wise attendance reports</p>
        </div>
        <button onClick={exportToPDF} className="btn-primary flex items-center gap-2">
          <Download size={18} /> Export PDF
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Search employees..." 
            className="input-field pl-10" 
          />
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="input-field w-auto text-surface-700 dark:text-surface-200"
        />
        <select 
          value={selectedDept} 
          onChange={e => setSelectedDept(e.target.value)} 
          className="input-field w-auto min-w-[200px]"
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {recordsLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h3 className="font-semibold text-surface-900 dark:text-white">Records for {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
            <div className="flex items-center gap-3 text-xs font-medium text-surface-500 bg-surface-50 dark:bg-surface-800 p-2 rounded-lg">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-success" /> Present</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-warning" /> Late</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-danger" /> Absent</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-info" /> Half Day</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-accent-500" /> Leave</span>
            </div>
          </div>
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-700">
                  <th className="py-3 px-4 text-surface-400 font-medium sticky left-0 bg-white dark:bg-surface-900 z-10 min-w-[200px]">Employee</th>
                  <th className="py-3 px-4 text-surface-400 font-medium min-w-[150px]">Department</th>
                  {daysArray.map(d => (
                    <th key={d} className="py-3 px-1 text-center text-surface-400 font-medium min-w-[28px]">{d}</th>
                  ))}
                  <th className="py-3 px-4 text-surface-400 font-medium text-right sticky right-0 bg-white dark:bg-surface-900 z-10 w-32 shadow-[-4px_0_10px_rgba(0,0,0,0.02)]">Summary</th>
                </tr>
              </thead>
              <tbody>
                {employeeRows.length > 0 ? employeeRows.map((row, i) => {
                  const emp = row.employee;
                  const presentCount = daysArray.filter(d => row.records[d] === 'present').length;
                  const lateCount = daysArray.filter(d => row.records[d] === 'late').length;
                  const totalWorking = presentCount + lateCount;
                  
                  return (
                    <tr key={emp.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 animate-slide-up group" style={{ animationDelay: `${i * 30}ms` }}>
                      <td className="py-3 px-4 font-medium text-surface-700 dark:text-surface-200 sticky left-0 bg-white dark:bg-surface-900 z-10 group-hover:bg-surface-50 dark:group-hover:bg-surface-800/50 transition-colors">
                        {emp?.userId?.firstName} {emp?.userId?.lastName}
                        <span className="block text-xs text-surface-400 font-normal">{emp?.employeeId}</span>
                      </td>
                      <td className="py-3 px-4 text-surface-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 size={14} className="text-surface-400" />
                          {emp?.department?.name || 'N/A'}
                        </span>
                      </td>
                      {daysArray.map(d => {
                        const status = row.records[d];
                        let colorClass = 'bg-surface-100 dark:bg-surface-800';
                        let title = 'No Record';
                        if (status === 'present') { colorClass = 'bg-success'; title = 'Present'; }
                        else if (status === 'late') { colorClass = 'bg-warning'; title = 'Late'; }
                        else if (status === 'absent') { colorClass = 'bg-danger'; title = 'Absent'; }
                        else if (status === 'half-day') { colorClass = 'bg-info'; title = 'Half Day'; }
                        else if (status === 'leave') { colorClass = 'bg-accent-500'; title = 'On Leave'; }

                        return (
                          <td key={d} className="py-2 px-1 text-center">
                            <div className={`w-5 h-5 mx-auto rounded-full ${colorClass} transition-transform hover:scale-125 cursor-pointer shadow-sm`} title={`${new Date(year, month, d).toDateString()} - ${title}`} />
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 sticky right-0 bg-white dark:bg-surface-900 z-10 group-hover:bg-surface-50 dark:group-hover:bg-surface-800/50 transition-colors shadow-[-4px_0_10px_rgba(0,0,0,0.02)] text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-xs font-bold text-surface-600 dark:text-surface-300 bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded-md" title={`Total Working Days: ${totalWorking}`}>
                            W: {totalWorking}
                          </span>
                          <button onClick={() => exportEmployeePDF(row)} className="text-primary-500 hover:text-primary-600 transition-colors" title={`Download ${emp?.userId?.firstName}'s Report`}>
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={daysInMonth + 3} className="py-8 text-center text-surface-400">
                      No attendance records found for this period.
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

const EmployeeAttendanceView = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [liveHours, setLiveHours] = useState('00:00:00');

  const [dateRange] = useState(() => ({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString()
  }));

  const { data: todayData, refetch: refetchToday } = useQuery(GET_TODAY_ATTENDANCE, { fetchPolicy: 'network-only' });
  const { data: historyData } = useQuery(GET_MY_ATTENDANCE, {
    variables: dateRange,
    fetchPolicy: 'network-only'
  });

  const [checkIn, { loading: checkingIn }] = useMutation(CHECK_IN);
  const [checkOut, { loading: checkingOut }] = useMutation(CHECK_OUT);

  const today = todayData?.todayAttendance;
  const history = historyData?.myAttendance || [];

  useEffect(() => {
    let interval;
    if (today?.checkIn && !today?.checkOut) {
      const checkInTime = parseInt(today.checkIn) || new Date(today.checkIn).getTime();
      
      const updateTimer = () => {
        const diff = Date.now() - checkInTime;
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        setLiveHours(`${h}:${m}:${s}`);
      };
      
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    }
    return () => clearInterval(interval);
  }, [today]);

  const handleCheckIn = async () => {
    try {
      await checkIn({ variables: { notes: notes || undefined } });
      toast.success('Checked in successfully! ✅');
      setNotes('');
      refetchToday();
    } catch (err) { toast.error(err.message); }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut();
      toast.success('Checked out! Have a great evening 🌅');
      refetchToday();
    } catch (err) { toast.error(err.message); }
  };

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Attendance</h1>

      {/* Today's Status Card */}
      <div className="card bg-gradient-to-br from-primary-500 to-accent-600 border-0 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-white/70 text-sm">{greeting}, {user?.firstName}!</p>
            <h2 className="text-3xl font-bold mt-1">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
            <p className="text-white/60 mt-1 text-sm">{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>

          <div className="flex items-center gap-4">
            {!today?.checkIn ? (
              <div className="flex items-center gap-3">
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" className="px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur text-white placeholder-white/50 border border-white/20 text-sm outline-none focus:bg-white/30" />
                <button onClick={handleCheckIn} disabled={checkingIn} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-primary-600 font-semibold text-sm hover:bg-white/90 transition-all shadow-lg">
                  {checkingIn ? <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /> : <><LogIn size={18} /> Check In</>}
                </button>
              </div>
            ) : !today?.checkOut ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="text-center sm:text-right bg-white/10 px-4 py-2 rounded-xl backdrop-blur border border-white/10 shadow-inner">
                  <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-0.5">Live Duration</p>
                  <p className="text-3xl font-mono font-bold tracking-tight">{liveHours}</p>
                </div>
                <div className="h-10 w-px bg-white/20 hidden sm:block"></div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-white/60">Checked in at</p>
                    <p className="text-lg font-bold">{formatTime(today.checkIn)}</p>
                  </div>
                  <button onClick={handleCheckOut} disabled={checkingOut} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/20 backdrop-blur text-white font-bold text-sm hover:bg-white/30 transition-all border border-white/30 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                    {checkingOut ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogOut size={18} /> Check Out</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-white/10 p-4 rounded-2xl backdrop-blur border border-white/10 shadow-lg">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-0.5">Total Working Hours</p>
                  <p className="text-3xl font-bold tracking-tight">{today.workHours?.toFixed(2) || '0.00'}<span className="text-base font-medium text-white/70 ml-1">hrs</span></p>
                </div>
                <div className="h-10 w-px bg-white/20 hidden sm:block"></div>
                <div className="flex flex-wrap items-center justify-center gap-6">
                  <div className="text-center hidden sm:block">
                    <p className="text-xs text-white/60">Last Out</p>
                    <p className="font-bold text-lg">{formatTime(today.checkOut)}</p>
                  </div>
                  <CheckCircle size={32} className="text-green-300 drop-shadow-md hidden md:block" />
                  <button onClick={handleCheckIn} disabled={checkingIn} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-primary-600 font-bold text-sm hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ml-2">
                    {checkingIn ? <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /> : <><LogIn size={18} /> Resume Shift</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="card">
        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Attendance History (Last 30 Days)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-700">
                <th className="text-left py-3 px-4 text-surface-400 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-surface-400 font-medium">Check In</th>
                <th className="text-left py-3 px-4 text-surface-400 font-medium">Check Out</th>
                <th className="text-left py-3 px-4 text-surface-400 font-medium">Hours</th>
                <th className="text-left py-3 px-4 text-surface-400 font-medium">Overtime</th>
                <th className="text-left py-3 px-4 text-surface-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record, i) => {
                const config = STATUS_CONFIG[record.status] || STATUS_CONFIG.present;
                const StatusIcon = config.icon;
                return (
                  <tr key={record.id} className="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800/50 animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                    <td className="py-3 px-4 font-medium text-surface-700 dark:text-surface-200">
                      {new Date(parseInt(record.date) || record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-surface-500">{formatTime(record.checkIn)}</td>
                    <td className="py-3 px-4 text-surface-500">{formatTime(record.checkOut)}</td>
                    <td className="py-3 px-4 font-medium text-surface-700 dark:text-surface-200">{record.workHours?.toFixed(1) || '0'}h</td>
                    <td className="py-3 px-4">
                      {record.overtime > 0 && <span className="text-accent-500 font-medium">+{record.overtime.toFixed(1)}h</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg}`} style={{ color: config.color }}>
                        <StatusIcon size={12} /> {config.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AttendancePage = () => {
  const { user } = useAuth();
  
  if (['admin', 'hr'].includes(user?.role)) {
    return <AdminAttendanceView />;
  }

  return <EmployeeAttendanceView />;
};

export default AttendancePage;


import { useQuery, useMutation } from "@apollo/client/react";
import { GET_MY_LEAVES, GET_LEAVES, REQUEST_LEAVE, APPROVE_LEAVE, REJECT_LEAVE } from '../graphql/operations';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { Plus, Calendar, Check, X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_COLORS = { casual: '#3b82f6', sick: '#ef4444', earned: '#10b981', maternity: '#ec4899', paternity: '#8b5cf6', unpaid: '#94a3b8' };
const STATUS_BG = { pending: 'bg-warning/10 text-warning', approved: 'bg-success/10 text-success', rejected: 'bg-danger/10 text-danger' };

const LeavesPage = () => {
  const { user } = useAuth();
  // Allow HR and Managers/Leaders to approve leaves. Prevent Admin.
  const canApproveLeaves = ['admin', 'team_manager', 'manager', 'team_leader', 'leader', 'hr'].includes(user?.role?.toLowerCase());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'casual', startDate: '', endDate: '', reason: '' });

  const { data: myData, refetch: refetchMy } = useQuery(GET_MY_LEAVES);
  const { data: allData, refetch: refetchAll } = useQuery(GET_LEAVES, { skip: !canApproveLeaves, variables: { status: 'pending' } });
  const [requestLeave, { loading }] = useMutation(REQUEST_LEAVE);
  const [approveLeave] = useMutation(APPROVE_LEAVE);
  const [rejectLeave] = useMutation(REJECT_LEAVE);

  const myLeaves = myData?.myLeaves || [];
  const pendingLeaves = allData?.leaves || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await requestLeave({ variables: { input: form } });
      toast.success('Leave requested');
      setShowForm(false);
      setForm({ type: 'casual', startDate: '', endDate: '', reason: '' });
      refetchMy();
    } catch (err) { toast.error(err.message); }
  };

  const handleApprove = async (id) => {
    try { await approveLeave({ variables: { id } }); toast.success('Approved'); refetchAll(); } catch (err) { toast.error(err.message); }
  };

  const handleReject = async (id) => {
    try { await rejectLeave({ variables: { id } }); toast.success('Rejected'); refetchAll(); } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Leave Management</h1>
          <p className="text-surface-400 text-sm mt-1">{canApproveLeaves ? `${pendingLeaves.length} pending approvals` : `${myLeaves.length} leave requests`}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={18} /> Request Leave</button>
      </div>

      {/* Pending Approvals (Manager/HR) */}
      {canApproveLeaves && pendingLeaves.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2"><Clock size={18} className="text-warning" /> Pending Approvals</h3>
          <div className="space-y-3">
            {pendingLeaves.map(leave => (
              <div key={leave.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full" style={{ background: TYPE_COLORS[leave.type] }} />
                  <div>
                    <p className="font-semibold text-surface-800 dark:text-white">{leave.employee?.userId?.firstName} {leave.employee?.userId?.lastName}</p>
                    <p className="text-xs text-surface-400 capitalize">{leave.type} Leave · {leave.days} day{leave.days > 1 ? 's' : ''}</p>
                    <p className="text-xs text-surface-400 mt-0.5">{leave.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleApprove(leave.id)} className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20"><Check size={16} /></button>
                  <button onClick={() => handleReject(leave.id)} className="p-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20"><X size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Leaves */}
      <div className="card">
        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">My Leave Requests</h3>
        {myLeaves.length === 0 ? (
          <p className="text-center text-surface-400 py-8">No leave requests yet</p>
        ) : (
          <div className="space-y-3">
            {myLeaves.map((leave, i) => (
              <div key={leave.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full" style={{ background: TYPE_COLORS[leave.type] }} />
                  <div>
                    <p className="font-medium text-surface-800 dark:text-white capitalize">{leave.type} Leave</p>
                    <p className="text-xs text-surface-400">
                      {new Date(parseInt(leave.startDate) || leave.startDate).toLocaleDateString()} — {new Date(parseInt(leave.endDate) || leave.endDate).toLocaleDateString()} · {leave.days} day{leave.days > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BG[leave.status]}`}>{leave.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">Request Leave</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Leave Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="input-field">
                  <option value="casual">Casual</option>
                  <option value="sick">Sick</option>
                  <option value="earned">Earned</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">From</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">To</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="input-field" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Reason</label>
                <textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} className="input-field min-h-[80px]" required />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">{loading ? 'Submitting...' : 'Submit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavesPage;


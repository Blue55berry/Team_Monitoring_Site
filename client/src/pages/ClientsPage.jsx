import { useQuery, useMutation } from "@apollo/client/react";
import { GET_CLIENTS, DELETE_CLIENT } from '../graphql/operations';
import { useState } from 'react';
import { Plus, Search, Briefcase, Mail, Phone, Globe, Calendar, Trash2, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

const RAG_COLORS = { green: '#10b981', amber: '#f59e0b', red: '#ef4444' };
const STATUS_BG = { active: 'bg-success/10 text-success', inactive: 'bg-surface-200 text-surface-500', prospect: 'bg-info/10 text-info' };

const ClientsPage = () => {
  const [search, setSearch] = useState('');
  const { data, loading, refetch } = useQuery(GET_CLIENTS);
  const [deleteClient] = useMutation(DELETE_CLIENT);

  const clients = (data?.clients || []).filter(c =>
    !search || c.companyName.toLowerCase().includes(search.toLowerCase()) || c.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return;
    try { await deleteClient({ variables: { id } }); toast.success('Client deleted'); refetch(); } catch (err) { toast.error(err.message); }
  };

  const formatCurrency = (val) => val ? `$${val.toLocaleString()}` : '-';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Clients</h1>
          <p className="text-surface-400 text-sm mt-1">{clients.length} client relationships</p>
        </div>
        <button className="btn-primary"><Plus size={18} /> Add Client</button>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." className="input-field pl-10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="card p-0 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700">
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Client Company</th>
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Contact</th>
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Contract Value</th>
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px]">Status / Follow-up</th>
                  <th className="py-3.5 px-5 font-semibold text-surface-500 uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {clients.map((client, i) => (
                  <tr key={client.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors animate-slide-up group" style={{ animationDelay: `${i * 30}ms` }}>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
                          {client.companyName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-surface-900 dark:text-white leading-tight">{client.companyName}</p>
                          <p className="text-xs text-surface-500 mt-0.5">{client.industry || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="text-sm font-medium text-surface-900 dark:text-white flex items-center gap-1.5"><User size={13} className="text-surface-400 flex-shrink-0"/> <span className="truncate">{client.contactPerson}</span></p>
                      <p className="text-xs text-surface-500 flex items-center gap-1.5 mt-1"><Mail size={13} className="text-surface-400 flex-shrink-0"/> <span className="truncate">{client.email}</span></p>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-surface-900 dark:text-white">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(client.contractValue || 0)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_BG[client.status]}`}>{client.status}</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold rag-${client.ragStatus}`}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: RAG_COLORS[client.ragStatus] }} />
                          {client.ragStatus}
                        </span>
                      </div>
                      {client.followUpDate && (
                        <p className="text-[11px] text-surface-500 flex items-center gap-1 mt-1">
                          <Calendar size={11} className="flex-shrink-0" /> {new Date(parseInt(client.followUpDate) || client.followUpDate).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors"><Edit3 size={15} /></button>
                        <button onClick={() => handleDelete(client.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-surface-400 hover:text-danger transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-surface-400">
                      <p className="font-medium">No clients found.</p>
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

import { User } from 'lucide-react';
export default ClientsPage;


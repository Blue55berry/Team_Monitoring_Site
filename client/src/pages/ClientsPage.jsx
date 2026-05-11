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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {clients.map((client, i) => (
            <div key={client.id} className="card group animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                    {client.companyName[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-900 dark:text-white">{client.companyName}</h3>
                    <p className="text-xs text-surface-400">{client.industry || 'N/A'}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BG[client.status]}`}>{client.status}</span>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-surface-500"><User size={14} /> <span>{client.contactPerson}</span></div>
                <div className="flex items-center gap-2 text-surface-500"><Mail size={14} /> <span className="truncate">{client.email}</span></div>
                {client.phone && <div className="flex items-center gap-2 text-surface-500"><Phone size={14} /> <span>{client.phone}</span></div>}
              </div>

              <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700 flex items-center justify-between">
                <div>
                  <p className="text-xs text-surface-400">Contract Value</p>
                  <p className="text-lg font-bold text-surface-900 dark:text-white">{formatCurrency(client.contractValue)}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold rag-${client.ragStatus}`}>
                  <span className="w-2 h-2 rounded-full" style={{ background: RAG_COLORS[client.ragStatus] }} />
                  {client.ragStatus}
                </span>
              </div>

              {client.followUpDate && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-warning">
                  <Calendar size={12} />
                  Follow-up: {new Date(parseInt(client.followUpDate) || client.followUpDate).toLocaleDateString()}
                </div>
              )}

              <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="btn-secondary py-1.5 px-3 text-xs flex-1 justify-center"><Edit3 size={13} /> Edit</button>
                <button onClick={() => handleDelete(client.id)} className="btn-danger py-1.5 px-3 text-xs"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import { User } from 'lucide-react';
export default ClientsPage;


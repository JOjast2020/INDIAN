import React, { useMemo, useState } from 'react';
import { Download, History, Search, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AuditLogView: React.FC = () => {
  const { state, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  const modules = useMemo(() => {
    const set = new Set<string>();
    state.auditLogs.forEach(l => set.add(l.module));
    return Array.from(set);
  }, [state.auditLogs]);

  const filteredLogs = useMemo(() => {
    return state.auditLogs.filter(l => {
      const matchSearch =
        l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.action.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMod = moduleFilter === 'all' || l.module === moduleFilter;
      return matchSearch && matchMod;
    });
  }, [state.auditLogs, searchTerm, moduleFilter]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Module', 'Details'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.action}"`,
      `"${l.module}"`,
      `"${l.details}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `System_Audit_Log_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Audit log exported successfully.');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search action, user, invoice number or description..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs bg-white outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white text-slate-700 outline-hidden"
          >
            <option value="all">All Modules</option>
            {modules.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Trail</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User & Role</th>
                <th className="px-4 py-3">Action Code</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Audit Details & Entity Mutation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400 font-sans">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{l.timestamp}</td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-slate-900 font-sans">{l.userName}</span>
                      <span className="text-[10px] text-slate-500 font-mono ml-1.5">({l.userRole})</span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          l.action.includes('VOID') || l.action.includes('DELETE')
                            ? 'bg-rose-100 text-rose-800'
                            : l.action.includes('CREATE')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {l.action}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-sans font-semibold text-slate-700">{l.module}</td>

                    <td className="px-4 py-3 font-sans text-slate-800 leading-relaxed">{l.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import { useEffect, useState } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Database,
  Download,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  Table2,
  X,
} from 'lucide-react';
import { simsApi, subscribeApiLogs, type DbInspectResponse } from '../services/api';
import type { ApiRequestLog } from '../types/sims';
import type { PublicSimsData } from '../services/api';

interface BackendInspectorProps {
  onDataReset: (fresh: PublicSimsData) => void;
  onNotify: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export function BackendInspector({ onDataReset, onNotify }: BackendInspectorProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'tables' | 'requests' | 'system'>('tables');
  const [inspectData, setInspectData] = useState<DbInspectResponse | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('students');
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<ApiRequestLog[]>([]);

  useEffect(() => {
    return subscribeApiLogs(setLogs);
  }, []);

  const fetchInspect = async () => {
    setLoading(true);
    try {
      const res = await simsApi.inspectDb();
      setInspectData(res);
    } catch (err) {
      onNotify('error', 'Backend Inspect Error', err instanceof Error ? err.message : 'Failed to load DB');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchInspect();
    }
  }, [open]);

  const handleDownloadJson = () => {
    if (!inspectData) return;
    const blob = new Blob([JSON.stringify(inspectData.collections, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cgc-sims-db-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('success', 'Snapshot Downloaded', 'Exported live backend JSON database.');
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await simsApi.resetDb();
      onDataReset(res.data);
      await fetchInspect();
      onNotify('info', 'Demo Database Reset', 'Restored all tables to initial realistic university seed.');
    } catch (err) {
      onNotify('error', 'Reset Failed', err instanceof Error ? err.message : 'Could not reset DB');
    } finally {
      setLoading(false);
    }
  };

  const activeCollection = inspectData?.collections?.[selectedTable];
  const rows: Record<string, unknown>[] = Array.isArray(activeCollection)
    ? activeCollection
    : activeCollection && typeof activeCollection === 'object'
    ? [activeCollection as Record<string, unknown>]
    : [];

  const filteredRows = rows.filter((row) =>
    !searchTerm.trim()
      ? true
      : JSON.stringify(row).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns =
    filteredRows.length > 0
      ? Object.keys(filteredRows[0]).filter((k) => k !== 'avatar').slice(0, 6)
      : [];

  return (
    <div className="fixed bottom-4 right-4 z-40 no-print">
      {/* Corner Floating Trigger Button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#102A43] text-white border border-slate-700/80 shadow-xl transition-all text-xs font-semibold"
        >
          <Database className="w-4 h-4 text-blue-300 shrink-0" />
          <span className="whitespace-nowrap">Backend Data</span>
          <span className="font-mono text-[11px] text-blue-200 bg-white/10 px-1.5 py-0.5 rounded tabular-nums">
            {logs.length} reqs
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-300" />
        </button>
      )}

      {/* Expandable Backend System Drawer */}
      {open && (
        <div className="w-[calc(100vw-2rem)] sm:w-[680px] lg:w-[780px] max-h-[82vh] bg-white border border-slate-300 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-[#0B1F3A] text-white px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <Server className="w-4 h-4 text-blue-300 shrink-0" />
              <div className="min-w-0">
                <p className="font-display text-sm font-bold truncate">
                  Backend System & Database Inspector
                </p>
                <p className="text-[11px] text-blue-200 truncate">
                  {inspectData?.storageAdapter || 'Express REST API · data/sims_db.json'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={fetchInspect}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition-colors"
                title="Refresh backend snapshot"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition-colors"
                title="Minimize"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition-colors"
                aria-label="Close inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-navigation Tabs */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setTab('tables')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  tab === 'tables' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>Database Tables</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('requests')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  tab === 'requests' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>API Logs ({logs.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('system')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  tab === 'system' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>DB Info & Export</span>
              </button>
            </div>

            {tab === 'tables' && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter rows..."
                    className="pl-8 pr-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:border-blue-600 w-36"
                  />
                </div>
                <div className="flex items-center border border-slate-300 rounded-md overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`px-2.5 py-1 text-xs font-medium ${
                      viewMode === 'table' ? 'bg-[#0B1F3A] text-white' : 'text-slate-600'
                    }`}
                  >
                    Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('json')}
                    className={`px-2.5 py-1 text-xs font-medium ${
                      viewMode === 'json' ? 'bg-[#0B1F3A] text-white' : 'text-slate-600'
                    }`}
                  >
                    JSON
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col sm:flex-row min-h-[320px]">
            {tab === 'tables' && (
              <>
                {/* Collection List */}
                <div className="sm:w-48 border-b sm:border-b-0 sm:border-r border-slate-200 bg-slate-50/70 p-2 overflow-x-auto sm:overflow-y-auto flex sm:flex-col gap-1 shrink-0">
                  {(inspectData?.tableCounts || []).map((tbl) => (
                    <button
                      key={tbl.name}
                      type="button"
                      onClick={() => setSelectedTable(tbl.name)}
                      className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        selectedTable === tbl.name
                          ? 'bg-[#1D4ED8] text-white'
                          : 'text-slate-700 hover:bg-slate-200/70'
                      }`}
                    >
                      <span className="font-mono">{tbl.name}</span>
                      <span
                        className={`font-mono text-[11px] tabular-nums px-1.5 py-0.5 rounded ${
                          selectedTable === tbl.name ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {tbl.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Records Viewer */}
                <div className="flex-1 overflow-auto p-3 bg-white">
                  {viewMode === 'json' ? (
                    <pre className="text-[11px] font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto leading-relaxed">
                      {JSON.stringify(filteredRows, null, 2)}
                    </pre>
                  ) : filteredRows.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500 py-10">
                      No matching rows in `{selectedTable}`.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                          <tr>
                            {columns.map((col) => (
                              <th key={col} className="px-3 py-2 font-mono font-semibold whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredRows.slice(0, 50).map((row, i) => (
                            <tr key={String(row.id || i)} className="hover:bg-slate-50">
                              {columns.map((col) => {
                                const val = row[col];
                                const str =
                                  typeof val === 'object' && val !== null
                                    ? JSON.stringify(val)
                                    : String(val ?? '—');
                                return (
                                  <td
                                    key={col}
                                    className="px-3 py-2 text-slate-700 max-w-[180px] truncate font-mono text-[11px]"
                                    title={str}
                                  >
                                    {str}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === 'requests' && (
              <div className="flex-1 overflow-auto p-3 bg-white">
                {logs.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">
                    Perform any action in the app to observe live REST API requests.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Time</th>
                          <th className="px-3 py-2 font-semibold">Method</th>
                          <th className="px-3 py-2 font-semibold">Endpoint</th>
                          <th className="px-3 py-2 font-semibold">Status</th>
                          <th className="px-3 py-2 font-semibold text-right">Latency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-mono text-[11px] text-slate-500 tabular-nums whitespace-nowrap">
                              {log.timestamp}
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] font-semibold text-[#0B1F3A]">
                              {log.method}
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] text-slate-700">
                              <div>{log.endpoint}</div>
                              <div className="text-[10px] font-sans text-slate-500">{log.summary}</div>
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] tabular-nums">
                              <span
                                className={
                                  log.status >= 400
                                    ? 'text-red-600 font-semibold'
                                    : 'text-emerald-700 font-semibold'
                                }
                              >
                                {log.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] text-slate-600 text-right tabular-nums">
                              {log.durationMs} ms
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'system' && (
              <div className="flex-1 overflow-auto p-5 bg-white space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <p className="text-xs text-slate-500">Backend Engine</p>
                    <p className="text-sm font-semibold text-slate-900 mt-1">Node.js + Express</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <p className="text-xs text-slate-500">Database Size</p>
                    <p className="text-sm font-semibold font-mono tabular-nums text-slate-900 mt-1">
                      {inspectData ? `${(inspectData.fileSizeBytes / 1024).toFixed(1)} KB` : '—'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <p className="text-xs text-slate-500">Total Collections</p>
                    <p className="text-sm font-semibold font-mono tabular-nums text-slate-900 mt-1">
                      {inspectData?.tableCounts.length ?? 0}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-700 leading-relaxed space-y-2">
                  <p className="font-semibold text-slate-900">Production MySQL / MongoDB Migration Ready</p>
                  <p>
                    All frontend modules communicate exclusively through REST endpoints (<code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">/api/*</code>) served by <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">server.ts</code>. To switch from the built-in persistent JSON store (<code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">data/sims_db.json</code>) to MySQL or MongoDB, swap <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">readDb()</code> / <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">writeDb()</code> with your <code className="font-mono">mysql2</code> pool or <code className="font-mono">mongoose</code> models.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download DB Snapshot (JSON)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Demo Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


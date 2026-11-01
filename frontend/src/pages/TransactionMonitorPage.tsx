import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  RotateCcw,
  Search,
} from 'lucide-react';
import { api } from '../services/api';
import { PaginatedTransactions, TransactionRecord } from '../types';
import { TransactionDrawer } from '../components/TransactionDrawer';

export const TransactionMonitorPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') || 'all'
  );
  const [predictedFilter, setPredictedFilter] = useState('all');
  const [failedNode, setFailedNode] = useState(
    searchParams.get('node') || 'all'
  );
  const [hourFilter, setHourFilter] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState('finpath_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [data, setData] = useState<PaginatedTransactions | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlStatus = searchParams.get('status');
    const urlNode = searchParams.get('node');
    if (urlSearch !== null) setSearch(urlSearch);
    if (urlStatus !== null) setStatusFilter(urlStatus);
    if (urlNode !== null) setFailedNode(urlNode);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getTransactions({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        status_filter: statusFilter,
        predicted_filter: predictedFilter,
        failed_node: failedNode,
        hour: hourFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    page,
    search,
    statusFilter,
    predictedFilter,
    failedNode,
    hourFilter,
    sortBy,
    sortOrder,
  ]);

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPredictedFilter('all');
    setFailedNode('all');
    setHourFilter('');
    setSortBy('finpath_id');
    setSortOrder('asc');
    setPage(1);
    setSearchParams({});
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await api.exportTransactionsCsv({
        search: search.trim() || undefined,
        status_filter: statusFilter,
        predicted_filter: predictedFilter,
        failed_node: failedNode,
        hour: hourFilter,
      });
    } finally {
      setExporting(false);
    }
  };

  const renderSortIcon = (col: string) => {
    if (sortBy !== col)
      return <ArrowUpDown className="w-3.5 h-3.5 text-[#94A3B8]/50" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#22D3EE]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#22D3EE]" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            Transaction Monitor
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Explore individual transactions and investigate the operational
            conditions associated with their outcomes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetFilters}
            className="px-3 py-2 rounded-lg bg-[#151F30] border border-[#1E293B] hover:border-[#334155] text-xs font-medium text-[#94A3B8] hover:text-white flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="px-3.5 py-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Exporting CSV...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[#151F30] border border-[#1E293B] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search by ID */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search ID (e.g. FP-00000105)..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0B1120] border border-[#1E293B] text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6]"
          />
        </div>

        {/* Actual Status Filter */}
        <div className="flex items-center gap-2 bg-[#0B1120] border border-[#1E293B] rounded-lg px-3 py-2">
          <Filter className="w-3.5 h-3.5 text-[#3B82F6] shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent text-xs text-[#F8FAFC] focus:outline-none"
          >
            <option value="all" className="bg-[#101827]">
              Actual Status: All
            </option>
            <option value="success" className="bg-[#101827]">
              Actual: Successful Only
            </option>
            <option value="failed" className="bg-[#101827]">
              Actual: Failed Only
            </option>
          </select>
        </div>

        {/* Predicted Status Filter */}
        <div className="flex items-center gap-2 bg-[#0B1120] border border-[#1E293B] rounded-lg px-3 py-2">
          <Filter className="w-3.5 h-3.5 text-[#22D3EE] shrink-0" />
          <select
            value={predictedFilter}
            onChange={(e) => {
              setPredictedFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent text-xs text-[#F8FAFC] focus:outline-none"
          >
            <option value="all" className="bg-[#101827]">
              ML Predicted: All
            </option>
            <option value="success" className="bg-[#101827]">
              Predicted: Success
            </option>
            <option value="failed" className="bg-[#101827]">
              Predicted: Failure
            </option>
          </select>
        </div>

        {/* Failure Component Filter */}
        <div className="flex items-center gap-2 bg-[#0B1120] border border-[#1E293B] rounded-lg px-3 py-2">
          <Filter className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
          <select
            value={failedNode}
            onChange={(e) => {
              setFailedNode(e.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent text-xs text-[#F8FAFC] focus:outline-none"
          >
            <option value="all" className="bg-[#101827]">
              Failure Node: All
            </option>
            <option value="Server" className="bg-[#101827]">
              Node: Server
            </option>
            <option value="Bank" className="bg-[#101827]">
              Node: Bank
            </option>
            <option value="User" className="bg-[#101827]">
              Node: User
            </option>
            <option value="None" className="bg-[#101827]">
              Node: None (Succeeded)
            </option>
          </select>
        </div>

        {/* Hour Filter */}
        <div className="flex items-center gap-2 bg-[#0B1120] border border-[#1E293B] rounded-lg px-3 py-2">
          <select
            value={hourFilter}
            onChange={(e) => {
              setHourFilter(
                e.target.value === '' ? '' : Number(e.target.value)
              );
              setPage(1);
            }}
            className="w-full bg-transparent text-xs text-[#F8FAFC] focus:outline-none"
          >
            <option value="" className="bg-[#101827]">
              Hour (UTC): All 24 Hours
            </option>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h} className="bg-[#101827]">
                Hour {String(h).padStart(2, '0')}:00 UTC
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-xl bg-[#151F30] border border-[#1E293B] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-xs text-[#94A3B8]">
          <div>
            Showing{' '}
            <span className="font-mono font-semibold text-[#F8FAFC]">
              {data ? data.items.length : 0}
            </span>{' '}
            of{' '}
            <span className="font-mono font-semibold text-[#F8FAFC]">
              {data ? data.total.toLocaleString() : 0}
            </span>{' '}
            indexed transactions. Click any row to inspect full ML diagnostics.
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              Actual Simulated Status
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22D3EE]" />
              Model 1 & 2 Prediction
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#101827] text-[11px] uppercase tracking-wider text-[#94A3B8]">
                <th
                  onClick={() => handleSort('finpath_id')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Transaction ID</span>
                    {renderSortIcon('finpath_id')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('time')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Time</span>
                    {renderSortIcon('time')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('user_latency')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>User Lat</span>
                    {renderSortIcon('user_latency')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('server_latency')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Server Lat</span>
                    {renderSortIcon('server_latency')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('bank_latency')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Bank Lat</span>
                    {renderSortIcon('bank_latency')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('load')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>System Load</span>
                    {renderSortIcon('load')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('success')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Actual Status</span>
                    {renderSortIcon('success')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('predicted_success')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Predicted Status</span>
                    {renderSortIcon('predicted_success')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('failed_node')}
                  className="py-3.5 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Failure Component</span>
                    {renderSortIcon('failed_node')}
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-xs">
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-12 text-center text-[#94A3B8] animate-pulse"
                  >
                    Loading transactions from database...
                  </td>
                </tr>
              ) : !data || data.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="py-12 text-center text-[#94A3B8]"
                  >
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                data.items.map((tx) => {
                  const isSuccess = tx.success === 1;
                  const isPredSuccess = tx.predicted_success === 1;
                  return (
                    <tr
                      key={tx.finpath_id}
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-[#1E293B]/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-[#22D3EE]">
                        {tx.finpath_id}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#94A3B8]">
                        {String(tx.time).padStart(2, '0')}:00
                      </td>
                      <td
                        className={`py-3 px-3 font-mono ${
                          tx.user_latency > 70
                            ? 'text-[#F59E0B] font-semibold'
                            : 'text-[#F8FAFC]'
                        }`}
                      >
                        {tx.user_latency.toFixed(1)} ms
                      </td>
                      <td
                        className={`py-3 px-3 font-mono ${
                          tx.server_latency > 90
                            ? 'text-[#EF4444] font-semibold'
                            : 'text-[#F8FAFC]'
                        }`}
                      >
                        {tx.server_latency.toFixed(1)} ms
                      </td>
                      <td
                        className={`py-3 px-3 font-mono ${
                          tx.bank_latency > 80
                            ? 'text-[#EF4444] font-semibold'
                            : 'text-[#F8FAFC]'
                        }`}
                      >
                        {tx.bank_latency.toFixed(1)} ms
                      </td>
                      <td
                        className={`py-3 px-3 font-mono ${
                          tx.load > 20000
                            ? 'text-[#F59E0B] font-semibold'
                            : 'text-[#F8FAFC]'
                        }`}
                      >
                        {tx.load.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            isSuccess
                              ? 'bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30'
                              : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
                          }`}
                        >
                          {isSuccess ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          <span>{isSuccess ? 'Success' : 'Failed'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              isPredSuccess
                                ? 'bg-[#3B82F6]/15 text-[#22D3EE] border border-[#3B82F6]/30'
                                : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                            }`}
                          >
                            {isPredSuccess ? 'Pred: Success' : 'Pred: Fail'}
                          </span>
                          <span className="font-mono text-[11px] text-[#94A3B8]">
                            {(tx.success_probability * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span
                            className={
                              tx.failed_node === 'None'
                                ? 'text-[#94A3B8]'
                                : 'text-[#F8FAFC] font-semibold'
                            }
                          >
                            {tx.failed_node}
                          </span>
                          {tx.predicted_failed_node !== tx.failed_node && (
                            <span className="text-[10px] text-[#22D3EE]">
                              (ML: {tx.predicted_failed_node})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                          }}
                          className="p-1.5 rounded-md bg-[#0B1120] border border-[#1E293B] text-[#94A3B8] hover:text-[#22D3EE]"
                          title="Inspect Transaction"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && (
          <div className="px-5 py-3.5 border-t border-[#1E293B] bg-[#101827] flex items-center justify-between text-xs">
            <span className="text-[#94A3B8]">
              Page{' '}
              <strong className="text-[#F8FAFC] font-mono">{data.page}</strong>{' '}
              of{' '}
              <strong className="text-[#F8FAFC] font-mono">
                {data.total_pages}
              </strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
                className="px-3 py-1.5 rounded-lg bg-[#151F30] border border-[#1E293B] text-[#F8FAFC] disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={data.page >= data.total_pages}
                className="px-3 py-1.5 rounded-lg bg-[#151F30] border border-[#1E293B] text-[#F8FAFC] disabled:opacity-40 flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details Drawer */}
      <TransactionDrawer
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
};


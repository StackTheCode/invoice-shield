'use client';

import { useEffect, useState } from 'react';
import { getInvoices } from '@/lib/api';
import Link from 'next/link';

interface Invoice {
  id: string;
  vendorName: string;
  invoiceNumber: string;
  totalAmount: string;
  currency: string;
  status: 'pending' | 'safe' | 'suspicious' | 'fraudulent';
  riskScore: number;
  createdAt: string;
}

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await getInvoices();
      setInvoices(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      safe: 'badge-safe',
      suspicious: 'badge-warning',
      fraudulent: 'badge-danger',
      pending: 'badge-pending',
    };

    const icons = {
      safe: '✓',
      suspicious: '!',
      fraudulent: '×',
      pending: '○',
    };

    return (
      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]} {status.toUpperCase()}
      </span>
    );
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-400 font-bold';
    if (score >= 30) return 'text-orange-400 font-semibold';
    return 'text-emerald-400';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] crystal-overlay">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="glass-strong rounded-3xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700/80 to-slate-800/80 flex items-center justify-center text-2xl border border-slate-600/30">
                🛡️
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100">
                  InvoiceShield Dashboard
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">Monitor and manage your invoices</p>
              </div>
            </div>
            <Link
              href="/"
              className="glass px-5 py-2.5 rounded-xl hover:bg-white/10 transition font-medium text-sm text-slate-300 hover:text-slate-100 border border-slate-700/50"
            >
              + Upload New
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card rounded-2xl p-6 hover-lift">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Total Invoices</div>
            <div className="text-4xl font-bold text-slate-100">
              {invoices.length}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 hover-lift border-emerald-500/20">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Safe</div>
            <div className="text-4xl font-bold text-emerald-400">
              {invoices.filter(i => i.status === 'safe').length}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 hover-lift border-orange-500/20">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Suspicious</div>
            <div className="text-4xl font-bold text-orange-400">
              {invoices.filter(i => i.status === 'suspicious').length}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 hover-lift border-red-500/20">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Fraudulent</div>
            <div className="text-4xl font-bold text-red-400">
              {invoices.filter(i => i.status === 'fraudulent').length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="glass-strong rounded-3xl overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block">
                <svg className="animate-spin h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-slate-400 mt-4">Loading invoices...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <div className="text-red-400 mb-2 text-lg">⚠ Error</div>
              <div className="text-slate-400">{error}</div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-slate-400 mb-4">No invoices yet</div>
              <Link href="/" className="text-slate-300 hover:text-slate-100 transition font-medium">
                Upload your first invoice →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Risk Score
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">
                          {invoice.vendorName || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                        {invoice.invoiceNumber || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-200">
                        {invoice.currency} {invoice.totalAmount || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${getRiskColor(invoice.riskScore || 0)}`}>
                          {invoice.riskScore || 0}<span className="text-slate-600">/100</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/invoice/${invoice.id}`}
                          className="text-slate-400 hover:text-slate-200 text-sm font-medium transition"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
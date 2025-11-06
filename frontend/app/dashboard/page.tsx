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
            safe: 'bg-green-100 text-green-800',
            suspicious: 'bg-yellow-100 text-yellow-800',
            fraudulent: 'bg-red-100 text-red-800',
            pending: 'bg-gray-100 text-gray-800',
        };

        const icons = {
            safe: '✅',
            suspicious: '⚠️',
            fraudulent: '❌',
            pending: '⏳',
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
                {icons[status as keyof typeof icons]} {status.toUpperCase()}
            </span>
        );
    };

    const getRiskColor = (score: number) => {
        if (score >= 70) return 'text-red-600 font-bold';
        if (score >= 30) return 'text-yellow-600 font-semibold';
        return 'text-green-600';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                             InvoiceShield Dashboard
                            </h1>
                            <p className="text-gray-600 mt-1">Monitor and manage your invoices</p>
                        </div>
                        <Link
                            href="/"
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            + Upload New
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="text-sm text-gray-600">Total Invoices</div>
                        <div className="text-3xl font-bold text-gray-900 mt-1">
                            {invoices.length}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="text-sm text-gray-600">Safe</div>
                        <div className="text-3xl font-bold text-green-600 mt-1">
                            {invoices.filter(i => i.status === 'safe').length}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="text-sm text-gray-600">Suspicious</div>
                        <div className="text-3xl font-bold text-yellow-600 mt-1">
                            {invoices.filter(i => i.status === 'suspicious').length}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="text-sm text-gray-600">Fraudulent</div>
                        <div className="text-3xl font-bold text-red-600 mt-1">
                            {invoices.filter(i => i.status === 'fraudulent').length}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="text-gray-400">Loading invoices...</div>
                        </div>
                    ) : error ? (
                        <div className="p-12 text-center">
                            <div className="text-red-600">Error: {error}</div>
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-gray-400 mb-4">No invoices yet</div>
                            <Link href="/" className="text-blue-600 hover:underline">
                                Upload your first invoice
                            </Link>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Vendor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Invoice #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Risk Score
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">
                                                {invoice.vendorName || 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {invoice.invoiceNumber || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium">
                                            {invoice.currency} {invoice.totalAmount || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={getRiskColor(invoice.riskScore || 0)}>
                                                {invoice.riskScore || 0}/100
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(invoice.status)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(invoice.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/invoice/${invoice.id}`}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                View Details →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import InvoiceUpload from '@/components/InvoiceUpload';
import { useAuth } from '@/contexts/AuthContext';
export default function Home() {
  const {user,logout} =useAuth();
  return (
     <ProtectedRoute>
      <div className="min-h-screen p-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="glass-strong rounded-2xl p-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-100 mb-1">
                Invoice Fraud Detection
              </h1>
              <p className="text-slate-400 text-sm">
                Welcome back, {user?.name || user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 
                text-slate-300 hover:text-slate-100 hover:border-slate-600 
                transition-all text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <InvoiceUpload />
      </div>
    </ProtectedRoute>
  );
}
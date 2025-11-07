import InvoiceUpload from "@/components/InvoiceUpload";
import Link from "next/link";

export default function Home() {
  return (
   <main className="min-h-screen bg-[#0a0a0f] crystal-overlay">
      <div className="container mx-auto px-4 py-12">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700/80 to-slate-800/80 flex items-center justify-center text-xl border border-slate-600/30 float">
              🛡️
            </div>
            <span className="text-xl font-semibold text-slate-100">InvoiceShield</span>
          </div>
          <Link
            href="/dashboard"
            className="glass px-5 py-2.5 rounded-xl hover:bg-white/5 transition font-medium text-sm text-slate-300 hover:text-slate-100 border border-slate-700/50"
          >
            Dashboard →
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="gradient-text">AI-Powered</span>
            <br />
            <span className="text-slate-200">Invoice Fraud Detection</span>
          </h1>
          <p className="text-lg text-slate-400 mb-8 leading-relaxed">
            Verify invoices in seconds with intelligent OCR and machine learning.
            <br />
            Stop fraudulent payments before they happen.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            {[
              { label: 'Real-time OCR', color: 'emerald' },
              { label: 'AI Analysis', color: 'blue' },
              { label: 'Instant Results', color: 'slate' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full bg-${item.color}-400/60 animate-pulse`}></span>
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Upload Component */}
        <InvoiceUpload />

        {/* Features */}
        <div className="mt-24 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '📄',
              title: 'Smart OCR',
              description: 'Automatically extract vendor details, payment info, and amounts from any invoice format'
            },
            {
              icon: '🔍',
              title: 'Fraud Detection',
              description: 'Advanced algorithms identify suspicious patterns, mismatches, and fraudulent attempts'
            },
            {
              icon: '⚡',
              title: 'Instant Analysis',
              description: 'Get comprehensive risk assessments and actionable insights in under 3 seconds'
            }
          ].map((feature, i) => (
            <div key={i} className="glass rounded-3xl p-6 hover-lift border border-slate-800/50">
              <div className="text-3xl mb-4 opacity-80">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2 text-slate-200">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
'use client';

import { analyzeInvoice, uploadInvoice } from '@/lib/api';
import React from 'react'
import { useState } from 'react'
export default function InvoiceUpload() {

    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (selectedFile: File) => {
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(selectedFile.type)) {
            setError('Please upload a PDF or image file');
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setFile(selectedFile);
        setError(null);
        setResult(null);
    };

    const handleUploadAndAnalyze = async () => {
        if (!file) return;

        try {
            setUploading(true);
            setError(null);

            const uploadResponse = await uploadInvoice(file);
            const invoiceId = uploadResponse.data.id;

            setUploading(false);
            setAnalyzing(true);

            const analysisResponse = await analyzeInvoice(invoiceId);
            setResult(analysisResponse.data);
            setAnalyzing(false);
            setFile(null);

        } catch (err: any) {
            setError(err.message || 'Failed to process invoice');
            setUploading(false);
            setAnalyzing(false);
        }
    };

    const getRiskColor = (score: number) => {
        if (score >= 70) return 'from-red-500 to-pink-600';
        if (score >= 30) return 'from-yellow-500 to-orange-600';
        return 'from-green-500 to-emerald-600';
    };

    const getRiskIcon = (score: number) => {
        if (score >= 70) return '🚨';
        if (score >= 30) return '⚠️';
        return '✅';
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return '🔴';
            case 'high': return '🟠';
            case 'medium': return '🟡';
            case 'low': return '🟢';
            default: return '⚪';
        }
    };
      const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

    return (
        <div className="max-w-4xl mx-auto">
      {/* Upload Area */}
      <div className="glass-strong rounded-3xl p-8 hover-lift">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/30 mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-slate-100">
            Upload Invoice
          </h2>
          <p className="text-slate-400 text-sm">Analyze for fraud in real-time</p>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
            dragActive 
              ? 'border-slate-400 bg-slate-700/20' 
              : 'border-slate-700 hover:border-slate-600'
          }`}
        >
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading || analyzing}
          />
          
          <div className="text-center">
            {file ? (
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-200 font-medium">{file.name}</p>
                <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-slate-400 hover:text-slate-300 text-sm transition"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <svg className="w-12 h-12 mx-auto mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-slate-300 mb-2">Drop your invoice here</p>
                <p className="text-sm text-slate-500">or click to browse files</p>
                <p className="text-xs text-slate-600 mt-2">PDF, PNG, JPG • Max 10MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleUploadAndAnalyze}
          disabled={!file || uploading || analyzing}
          className="w-full mt-6 bg-gradient-to-r from-slate-700 to-slate-800 text-slate-100 py-4 px-6 rounded-xl font-medium
            hover:from-slate-600 hover:to-slate-700 disabled:from-slate-800 disabled:to-slate-900 disabled:cursor-not-allowed disabled:text-slate-600
            transition-all shadow-lg hover:shadow-slate-900/50 border border-slate-600/30 relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {uploading && (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            )}
            {analyzing && (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            )}
            {!uploading && !analyzing && 'Analyze Invoice'}
          </span>
        </button>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <p className="text-red-400 text-sm flex items-center gap-2">
              <span className="text-lg">×</span>
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Risk Score Card */}
          <div className={`glass-strong rounded-3xl p-8 border ${
            result.fraudAnalysis.riskScore >= 70 ? 'border-red-500/20 glow-danger' :
            result.fraudAnalysis.riskScore >= 30 ? 'border-orange-500/20 glow-warning' :
            'border-emerald-500/20 glow-success'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-200">Risk Assessment</h3>
              <div className={`flex items-center justify-center w-12 h-12 rounded-xl text-2xl ${
                result.fraudAnalysis.riskScore >= 70 ? 'bg-red-500/10' :
                result.fraudAnalysis.riskScore >= 30 ? 'bg-orange-500/10' :
                'bg-emerald-500/10'
              }`}>
                {getRiskIcon(result.fraudAnalysis.riskScore)}
              </div>
            </div>
            
            {/* Score Display */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-3">
                <span className={`text-6xl font-bold bg-gradient-to-br ${getRiskColor(result.fraudAnalysis.riskScore)} bg-clip-text text-transparent`}>
                  {result.fraudAnalysis.riskScore}
                </span>
                <span className="text-2xl text-slate-500">/100</span>
              </div>
              
              {/* Progress Bar */}
              <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getRiskColor(result.fraudAnalysis.riskScore)} transition-all duration-1000 ease-out`}
                  style={{ width: `${result.fraudAnalysis.riskScore}%` }}
                />
              </div>
            </div>

            <p className="text-lg font-medium uppercase tracking-wider text-slate-300">
              {result.fraudAnalysis.status}
            </p>
          </div>

          {/* Extracted Data */}
          <div className="glass-strong rounded-3xl p-6">
            <h4 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
              <span className="text-slate-400">●</span> Extracted Information
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Vendor', value: result.parsedData.vendorName },
                { label: 'Amount', value: `${result.parsedData.currency} ${result.parsedData.totalAmount}` },
                { label: 'VAT', value: result.parsedData.vatNumber },
                { label: 'IBAN', value: result.parsedData.iban },
                { label: 'Invoice #', value: result.parsedData.invoiceNumber },
                { label: 'Email', value: result.parsedData.email },
              ].map((item, i) => (
                <div key={i} className="glass rounded-xl p-3 border border-slate-700/30">
                  <div className="text-xs text-slate-500 mb-1 font-medium">{item.label}</div>
                  <div className="text-sm text-slate-200 truncate">{item.value || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Fraud Indicators */}
          {result.fraudAnalysis.indicators.length > 0 && (
            <div className="glass-strong rounded-3xl p-6 border border-red-500/20">
              <h4 className="text-lg font-semibold mb-4 text-red-300 flex items-center gap-2">
                <span>⚠</span> Issues Detected
              </h4>
              <div className="space-y-3">
                {result.fraudAnalysis.indicators.map((indicator: any, i: number) => (
                  <div key={i} className="glass rounded-xl p-4 border border-red-500/10">
                    <div className="flex items-start gap-3">
                      <span className={`text-xl ${getSeverityColor(indicator.severity)} mt-0.5`}>
                        {getSeverityIcon(indicator.severity)}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${
                            indicator.severity === 'critical' ? 'badge-danger' :
                            indicator.severity === 'high' ? 'badge-danger' :
                            indicator.severity === 'medium' ? 'badge-warning' :
                            'text-slate-400 bg-slate-800/30 border border-slate-700/30'
                          }`}>
                            {indicator.severity}
                          </span>
                        </div>
                        <p className="text-slate-200 text-sm font-medium mb-2">{indicator.message}</p>
                        {indicator.details && (
                          <div className="text-xs text-slate-400 font-mono p-2 rounded-lg bg-slate-900/50 border border-slate-800/50 overflow-x-auto">
                            <pre>{JSON.stringify(indicator.details, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Time */}
          <p className="text-xs text-slate-600 text-center font-medium">
            Processed in {result.processingTime}
          </p>
        </div>
      )}
    </div>
    );

}


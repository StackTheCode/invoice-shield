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




    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];

        if (selectedFile) {
            const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
            if (!validTypes.includes(selectedFile.type)) {
                setError("Please upload pdf or image  file")
                return;
            }
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                return;
            }
            setFile(selectedFile);
            setError(null);
            setResult(null);
        }
    }

    const handleUploadAndAnalyze = async () => {
        if (!file) return;
        try {
            setUploading(true)
            setError(null)
            console.log("uploading invoice ...")
            const uploadedResponse = await uploadInvoice(file)
            const invoiceId = uploadedResponse.data.id;

            setUploading(false);
            setAnalyzing(true);
            console.log("Analyzing invoice ...")
            const analysisResponse = await analyzeInvoice(invoiceId);

            setResult(analysisResponse.data)
            setAnalyzing(false)
            setFile(null)



        } catch (err: any) {
            setError(err.message || 'Failed to process invoice');
            setUploading(false);
            setAnalyzing(false);
        }



    }


    const getRiskColor = (score: number) => {
        if (score >= 70) return 'text-red-600 bg-red-50 border-red-200';
        if (score >= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-green-600 bg-green-50 border-green-200';
    };


    const getRiskIcon = (score: number) => {
        if (score >= 70) return '❌';
        if (score >= 30) return '⚠️';
        return '✅';
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6">Upload Invoice</h2>

                {/* File input */}
                <div className="mb-6">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                        Select invoice (PDF or image)
                    </label>
                    <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor-pointer"
                        disabled={uploading || analyzing}
                    />
                    {file && (
                        <p className="mt-2 text-sm text-gray-600">
                            Selected: {file.name} ({(file.size / 1024).toFixed(0)} KB)
                        </p>
                    )}
                </div>

                {/* Upload button */}
                <button
                    onClick={handleUploadAndAnalyze}
                    disabled={!file || uploading || analyzing}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold
            hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-colors"
                >
                    {uploading && 'Uploading...'}
                    {analyzing && 'Analyzing...'}
                    {!uploading && !analyzing && 'Upload & Analyze'}
                </button>

                {/* Error message */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="mt-6 space-y-4">
                        {/* Risk score */}
                        <div className={`p-6 rounded-lg border-2 ${getRiskColor(result.fraudAnalysis.riskScore)}`}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold">Risk Assessment</h3>
                                <span className="text-3xl">{getRiskIcon(result.fraudAnalysis.riskScore)}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold">{result.fraudAnalysis.riskScore}</span>
                                <span className="text-xl">/100</span>
                            </div>
                            <p className="mt-2 font-medium uppercase">{result.fraudAnalysis.status}</p>
                        </div>

                        {/* Extracted data */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold mb-3">Extracted Information</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-600">Vendor:</span>
                                    <p className="font-medium">{result.parsedData.vendorName || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Amount:</span>
                                    <p className="font-medium">
                                        {result.parsedData.currency} {result.parsedData.totalAmount || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-600">VAT:</span>
                                    <p className="font-medium">{result.parsedData.vatNumber || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">IBAN:</span>
                                    <p className="font-medium">{result.parsedData.iban || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Invoice #:</span>
                                    <p className="font-medium">{result.parsedData.invoiceNumber || 'N/A'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Email:</span>
                                    <p className="font-medium">{result.parsedData.email || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Fraud indicators */}
                        {result.fraudAnalysis.indicators.length > 0 && (
                            <div className="p-4 bg-red-50 rounded-lg">
                                <h4 className="font-semibold mb-3 text-red-900">⚠️ Issues Detected</h4>
                                <ul className="space-y-2">
                                    {result.fraudAnalysis.indicators.map((indicator: any, i: number) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <span className="text-red-600 mt-0.5">
                                                {indicator.severity === 'critical' ? '🔴' :
                                                    indicator.severity === 'high' ? '🟠' :
                                                        indicator.severity === 'medium' ? '🟡' : '🟢'}
                                            </span>
                                            <div>
                                                <p className="font-medium text-red-900">{indicator.message}</p>
                                                {indicator.details && (
                                                    <p className="text-red-700 text-xs mt-1">
                                                        {JSON.stringify(indicator.details)}
                                                    </p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Processing time */}
                        <p className="text-xs text-gray-500 text-right">
                            Processed in {result.processingTime}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

}


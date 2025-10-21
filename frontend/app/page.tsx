"use client";


import { useEffect, useState } from "react";

export default function Home() {
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
      .then(res => res.json())
      .then(data => {
        setApiStatus(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('API connection failed:', err);
        setLoading(false);
      });
  }, []);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">🛡️ InvoiceShield</h1>

      <div className="border rounded-lg p-6 bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Backend Status</h2>
        {loading ? (
          <p>Checking API connection...</p>
        ) : apiStatus ? (
          <div className="text-green-600">
            <p>✅ Connected</p>
            <p className="text-sm text-gray-600">{apiStatus.message}</p>
            <p className="text-xs text-gray-400">{apiStatus.timestamp}</p>
          </div>
        ) : (
          <p className="text-red-600">❌ Backend not responding</p>
        )}
      </div>
    </main>
  );
}

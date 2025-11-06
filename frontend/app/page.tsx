import InvoiceUpload from "@/components/InvoiceUpload";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-end mb-4">
            <Link
              href="/dashboard"
              className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-gray-50 transition font-semibold shadow"
            >
              View Dashboard →
            </Link>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🛡️ InvoiceShield
          </h1>
          <p className="text-xl text-gray-600">
            AI-powered fraud detection for business invoices
          </p>
        </div>

        {/* Upload component */}
        <InvoiceUpload />

        {/* Info cards */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-2">📄</div>
            <h3 className="font-semibold mb-2">Upload Invoice</h3>
            <p className="text-sm text-gray-600">
              PDF or image files supported
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-2">🔍</div>
            <h3 className="font-semibold mb-2">AI Analysis</h3>
            <p className="text-sm text-gray-600">
              OCR + fraud detection in seconds
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="font-semibold mb-2">Risk Score</h3>
            <p className="text-sm text-gray-600">
              Know if it's safe to pay
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
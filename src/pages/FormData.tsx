import { Database } from 'lucide-react';

export function FormData() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Form Data</h2>
        <p className="text-slate-600 mt-1">
          View and export all collected form data.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-teal-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Coming Soon</h3>
          <p className="text-slate-600 max-w-md mx-auto">
            The Form Data view is under development. This page will allow you to 
            view all collected patient data, export to various formats, and manage 
            form submissions.
          </p>
        </div>
      </div>
    </main>
  );
}
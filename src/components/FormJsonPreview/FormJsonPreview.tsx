import { useState } from 'react';
import { ClipboardList, ChevronUp, ChevronDown, Copy, Check } from 'lucide-react';
import { useProviderData } from '@/contexts/ProviderDataContext';

export function FormJsonPreview() {
  const { formData } = useProviderData();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const jsonOutput = JSON.stringify({ ...formData, today }, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = jsonOutput;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {isExpanded && (
        <div className="mb-2 w-80 max-h-96 overflow-auto bg-slate-900 dark:bg-slate-950 border border-slate-700 rounded-lg shadow-xl">
          <div className="sticky top-0 flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
            <span className="text-xs font-mono text-slate-300">Form JSON</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                title="Copy JSON"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
          <pre className="p-3 text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
            {jsonOutput}
          </pre>
        </div>
      )}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full shadow-lg transition-all text-sm font-medium"
      >
        <ClipboardList className="w-4 h-4" />
        <span className="hidden sm:inline">Form JSON</span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
    </div>
  );
}

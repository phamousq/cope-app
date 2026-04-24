import { forwardRef } from 'react';
import { ExternalLink } from 'lucide-react';

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  className?: string;
  helpUrl?: string;
  required?: boolean;
  /** Called when Enter is pressed — return the next input's focus method */
  onEnter?: () => void;
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  function SelectInput({ label, value, onChange, options, className = '', helpUrl, required, onEnter }, ref) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
      if (e.key === 'Enter' && onEnter) {
        e.preventDefault();
        onEnter();
      }
    };

    return (
      <div className={className}>
        <div className="flex items-center gap-1 mb-1">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {helpUrl && (
            <a
              href={helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
              title="View reference"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <select
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onEnter ? handleKeyDown : undefined}
          required={required}
          className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent ${required && !value ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
        >
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

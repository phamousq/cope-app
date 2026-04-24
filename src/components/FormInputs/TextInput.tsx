import { forwardRef } from 'react';
import { ExternalLink, HelpCircle } from 'lucide-react';

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
  helpUrl?: string;
  tooltip?: string;
  required?: boolean;
  /** Called when Enter is pressed — return the next input's focus method */
  onEnter?: () => void;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ label, value, onChange, placeholder, className = '', type = 'text', helpUrl, tooltip, required, onEnter }, ref) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
          {tooltip && (
            <span className="group relative">
              <HelpCircle className="w-3 h-3 text-slate-400" />
              <div className="hidden group-hover:block absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-slate-100 text-xs rounded whitespace-nowrap">
                {tooltip}
              </div>
            </span>
          )}
        </div>
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onEnter ? handleKeyDown : undefined}
          placeholder={placeholder}
          required={required}
          className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent ${required && !value ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
        />
      </div>
    );
  }
);

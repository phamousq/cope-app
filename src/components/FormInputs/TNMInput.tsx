interface TNMInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
  placeholder?: string;
}

export function TNMInput({ label, value, onChange, options, className = '', placeholder }: TNMInputProps) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
        {label}
      </label>
      <div className="relative group">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder={placeholder ?? 'T1, T2, N0...'}
          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent"
        />
        <div className="hidden group-hover:block absolute z-10 top-full left-0 mt-1 px-3 py-2 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-lg min-w-[180px]">
          <p className="font-medium text-slate-300 mb-1">Valid options:</p>
          <div className="flex flex-wrap gap-1">
            {options.map((opt) => (
              <span key={opt} className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-200 font-mono">{opt}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
